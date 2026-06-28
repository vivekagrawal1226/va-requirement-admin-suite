<?php
/**
 * REST API Endpoints for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class VA_Suite_API_Endpoints
 * Registers custom, lightweight REST routes to handle the SPA state logic without jQuery dependencies.
 */
class VA_Suite_API_Endpoints {

    /**
     * Namespace definition for the plugin API.
     */
    private $namespace = 'va-suite/v1';

    /**
     * Constructor to hook infrastructure initialization.
     */
    public function __construct() {
        add_action( 'rest_api_init', array( $this, 'register_api_routes' ) );
    }

    /**
     * Register individual decoupled CRUD routes.
     */
    public function register_api_routes() {
        
        // Route to fetch all data components at once (Dashboard view payload)
        register_rest_route( $this->namespace, '/workspace', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_workspace_data' ),
            'permission_callback' => array( $this, 'check_admin_permissions' ),
        ) );

        // Route to handle individual or batched ticket processing
        register_rest_route( $this->namespace, '/tickets', array(
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_tickets' ),
                'permission_callback' => array( $this, 'check_admin_permissions' ),
            ),
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_ticket' ),
                'permission_callback' => array( $this, 'check_admin_permissions' ),
            ),
        ) );

        // Route to update a specific ticket (e.g., status changes via HTML5 Drag-and-Drop)
        register_rest_route( $this->namespace, '/tickets/(?P<id>\d+)', array(
            'methods'             => WP_REST_Server::EDITABLE,
            'callback'            => array( $this, 'update_ticket' ),
            'permission_callback' => array( $this, 'check_admin_permissions' ),
            'args'                => array(
                'id' => array(
                    'validate_callback' => function($param, $request, $key) {
                        return is_numeric( $param );
                    }
                ),
            ),
        ) );
    }

    /**
     * Strict Admin-Only Guardrail.
     * Restricts background access strictly to users authorized to manage system operations.
     */
    public function check_admin_permissions() {
        return current_user_can( 'manage_options' );
    }

    /**
     * GET /va-suite/v1/workspace
     * Compiles an optimized, consolidated response for initializing global client state.
     */
    public function get_workspace_data( $request ) {
        $projects = get_posts( array(
            'post_type'      => 'va_project',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
        ) );

        $formatted_projects = array();
        foreach ( $projects as $project ) {
            $formatted_projects[] = array(
                'id'    => $project->ID,
                'title' => $project->post_title,
            );
        }

        // Gather structural lookup tax values (Statuses, Priorities)
        $statuses   = get_terms( array( 'taxonomy' => 'va_ticket_status', 'hide_empty' => false ) );
        $priorities = get_terms( array( 'taxonomy' => 'va_ticket_priority', 'hide_empty' => false ) );

        return new WP_REST_Response( array(
            'projects'   => $formatted_projects,
            'statuses'   => $this->format_terms( $statuses ),
            'priorities' => $this->format_terms( $priorities ),
        ), 200 );
    }

    /**
     * GET /va-suite/v1/tickets
     * Queries tracked items with optional filtering support matching client view constraints.
     */
    public function get_tickets( $request ) {
        $args = array(
            'post_type'      => 'va_ticket',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
        );

        // Dynamic filtering maps
        $project_id = $request->get_param( 'project' );
        if ( ! empty( $project_id ) ) {
            $args['meta_query'] = array(
                array(
                    'key'     => '_va_project_id',
                    'value'   => intval( $project_id ),
                    'compare' => '=',
                ),
            );
        }

        $tickets = get_posts( $args );
        $response = array();

        foreach ( $tickets as $ticket ) {
            $response[] = $this->prepare_ticket_for_response( $ticket );
        }

        return new WP_REST_Response( $response, 200 );
    }

    /**
     * POST /va-suite/v1/tickets
     * Submits a fresh entry into the repository backend.
     */
    public function create_ticket( $request ) {
        $params = $request->get_json_params();

        if ( empty( $params['title'] ) ) {
            return new WP_Error( 'missing_title', __( 'A title is required.', 'va-requirement-suite' ), array( 'status' => 400 ) );
        }

        $post_id = wp_insert_post( array(
            'post_type'   => 'va_ticket',
            'post_title'  => sanitize_text_field( $params['title'] ),
            'post_content'=> ! empty( $params['description'] ) ? wp_kses_post( $params['description'] ) : '',
            'post_status' => 'publish',
        ) );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error( 'db_error', __( 'Failed to save asset record.', 'va-requirement-suite' ), array( 'status' => 500 ) );
        }

        // Apply metadata & classifications relationships if set
        if ( ! empty( $params['project_id'] ) ) {
            update_post_meta( $post_id, '_va_project_id', intval( $params['project_id'] ) );
            
            // Auto-generate system reference key identifier sequence (e.g. PROJ-101)
            $project_slug = sanitize_title( get_the_title( $params['project_id'] ) );
            $ticket_key   = strtoupper( substr( $project_slug, 0, 4 ) ) . '-' . $post_id;
            update_post_meta( $post_id, '_va_ticket_key', $ticket_key );
        }

        if ( ! empty( $params['status'] ) ) {
            wp_set_object_terms( $post_id, sanitize_text_field( $params['status'] ), 'va_ticket_status' );
        }

        if ( ! empty( $params['priority'] ) ) {
            wp_set_object_terms( $post_id, sanitize_text_field( $params['priority'] ), 'va_ticket_priority' );
        }

        $ticket = get_post( $post_id );
        return new WP_REST_Response( $this->prepare_ticket_for_response( $ticket ), 201 );
    }

    /**
     * POST / PUT /va-suite/v1/tickets/{id}
     * Processes live updates matching changed visual card positions or edit properties.
     */
    public function update_ticket( $request ) {
        $ticket_id = $request['id'];
        $params    = $request->get_json_params();

        if ( ! get_post( $ticket_id ) ) {
            return new WP_Error( 'not_found', __( 'Record not found.', 'va-requirement-suite' ), array( 'status' => 404 ) );
        }

        // Update core content values if supplied
        $update_data = array( 'ID' => $ticket_id );
        $has_updates = false;

        if ( isset( $params['title'] ) ) {
            $update_data['post_title'] = sanitize_text_field( $params['title'] );
            $has_updates = true;
        }
        if ( isset( $params['description'] ) ) {
            $update_data['post_content'] = wp_kses_post( $params['description'] );
            $has_updates = true;
        }

        if ( $has_updates ) {
            wp_update_post( $update_data );
        }

        // Fast taxonomy adjustments (Perfect for dropping cards on the Kanban grid)
        if ( isset( $params['status'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_text_field( $params['status'] ), 'va_ticket_status' );
        }
        if ( isset( $params['priority'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_text_field( $params['priority'] ), 'va_ticket_priority' );
        }

        return new WP_REST_Response( $this->prepare_ticket_for_response( get_post( $ticket_id ) ), 200 );
    }

    /**
     * Helper to uniformly map database models into raw API objects.
     */
    private function prepare_ticket_for_response( $post ) {
        $statuses   = wp_get_object_terms( $post->ID, 'va_ticket_status' );
        $priorities = wp_get_object_terms( $post->ID, 'va_ticket_priority' );
        
        return array(
            'id'          => $post->ID,
            'key'         => get_post_meta( $post->ID, '_va_ticket_key', true ) ?: 'KEY-' . $post->ID,
            'title'       => $post->post_title,
            'description' => $post->post_content,
            'project_id'  => intval( get_post_meta( $post->ID, '_va_project_id', true ) ),
            'status'      => ! empty( $statuses ) ? $statuses[0]->slug : 'backlog',
            'priority'    => ! empty( $priorities ) ? $priorities[0]->slug : 'medium',
            'author'      => get_the_author_meta( 'display_name', $post->post_author ),
        );
    }

    /**
     * Helper to cleanly structuralize raw WP_Term definitions into key/value arrays.
     */
    private function format_terms( $terms ) {
        if ( is_wp_error( $terms ) || empty( $terms ) ) {
            return array();
        }
        return array_map( function( $term ) {
            return array(
                'slug' => $term->slug,
                'name' => $term->name,
            );
        }, $terms );
    }
}

// Automatically instantiate the endpoints layer
new VA_Suite_API_Endpoints();