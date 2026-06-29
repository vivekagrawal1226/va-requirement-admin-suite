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
 * Registers clean, lightweight REST routes to handle lifecycle CRUD logic.
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
        
        // Route to fetch initialization configuration data (Dashboard entry payload)
        register_rest_route( $this->namespace, '/workspace', array(
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => array( $this, 'get_workspace_data' ),
            'permission_callback' => array( $this, 'check_admin_permissions' ),
        ) );

        // Route to fetch or append tracking assets
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

        // Unified resource item identifier route path routing mapping (Edit & Delete actions)
        register_rest_route( $this->namespace, '/tickets/(?P<id>\d+)', array(
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array( $this, 'update_ticket' ),
                'permission_callback' => array( $this, 'check_admin_permissions' ),
            ),
            array(
                'methods'             => WP_REST_Server::DELETABLE,
                'callback'            => array( $this, 'delete_ticket' ),
                'permission_callback' => array( $this, 'check_admin_permissions' ),
            ),
        ) );
    }

    /**
     * Strict Admin-Only Guardrail.
     * Restricts background data flow access strictly to authorized administrators.
     */
    public function check_admin_permissions() {
        return current_user_can( 'manage_options' ); // Administrative capability filter gate
    }

    /**
     * GET /va-suite/v1/workspace
     * Compiles an optimized unified response payload for configuring global client state parameters.
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

        return new WP_REST_Response( array(
            'projects'   => $formatted_projects,
            'statuses'   => $this->format_terms( get_terms( array( 'taxonomy' => 'va_ticket_status', 'hide_empty' => false ) ) ),
            'priorities' => $this->format_terms( get_terms( array( 'taxonomy' => 'va_ticket_priority', 'hide_empty' => false ) ) ),
        ), 200 );
    }

    /**
     * GET /va-suite/v1/tickets
     * Queries active lifecycle tracking items filtering optionally by a parent project boundary context.
     */
    public function get_tickets( $request ) {
        $args = array(
            'post_type'      => 'va_ticket',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
        );

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
     * Submits a fresh requirement, bug, task, or user story directly to the core database storage engine.
     */
    public function create_ticket( $request ) {
        $params = $request->get_json_params();

        if ( empty( $params['title'] ) ) {
            return new WP_Error( 'missing_title', __( 'A title selection parameters field is required.', 'va-requirement-suite' ), array( 'status' => 400 ) );
        }

        $post_id = wp_insert_post( array(
            'post_type'    => 'va_ticket',
            'post_title'   => sanitize_text_field( $params['title'] ),
            'post_content' => ! empty( $params['description'] ) ? wp_kses_post( $params['description'] ) : '',
            'post_status'  => 'publish',
        ) );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error( 'db_error', __( 'Failed to save asset logging instance.', 'va-requirement-suite' ), array( 'status' => 500 ) );
        }

        // Apply critical metadata tracking associations strings if provided
        if ( ! empty( $params['project_id'] ) ) {
            update_post_meta( $post_id, '_va_project_id', intval( $params['project_id'] ) );
            
            // Build unique automated sequence reference tracking string keys (e.g., PROJ-101)
            $project_slug = sanitize_title( get_the_title( $params['project_id'] ) );
            $ticket_key   = strtoupper( substr( $project_slug, 0, 4 ) ) . '-' . $post_id;
            update_post_meta( $post_id, '_va_ticket_key', $ticket_key );
        }

        // Hydrate default classifications safely if left unassigned
        wp_set_object_terms( $post_id, ! empty( $params['status'] ) ? sanitize_text_field( $params['status'] ) : 'backlog', 'va_ticket_status' );
        wp_set_object_terms( $post_id, ! empty( $params['priority'] ) ? sanitize_text_field( $params['priority'] ) : 'medium', 'va_ticket_priority' );

        return new WP_REST_Response( $this->prepare_ticket_for_response( get_post( $post_id ) ), 201 );
    }

    /**
     * POST / PUT /va-suite/v1/tickets/{id}
     * Modifies text details or changes workflow status lanes dynamically.
     */
    public function update_ticket( $request ) {
        $ticket_id = $request['id'];
        $params    = $request->get_json_params();

        if ( ! get_post( $ticket_id ) ) {
            return new WP_Error( 'not_found', __( 'Record target entry missing.', 'va-requirement-suite' ), array( 'status' => 404 ) );
        }

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

        if ( isset( $params['status'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_text_field( $params['status'] ), 'va_ticket_status' );
        }
        if ( isset( $params['priority'] ) ) {
            wp_set_object_terms( $ticket_id, sanitize_text_field( $params['priority'] ), 'va_ticket_priority' );
        }

        return new WP_REST_Response( $this->prepare_ticket_for_response( get_post( $ticket_id ) ), 200 );
    }

    /**
     * DELETE /va-suite/v1/tickets/{id}
     * Permanently purges a requirement tracking row block completely from the system backend.
     */
    public function delete_ticket( $request ) {
        $ticket_id = $request['id'];
        
        if ( ! get_post( $ticket_id ) ) {
            return new WP_Error( 'not_found', __( 'Target item could not be resolved.', 'va-requirement-suite' ), array( 'status' => 404 ) );
        }

        // Bypasses the trash bin loop utility configuration parameters to perform an absolute delete
        $deleted = wp_delete_post( $ticket_id, true );

        if ( ! $deleted ) {
            return new WP_Error( 'db_error', __( 'Database deletion tracking error encountered.', 'va-requirement-suite' ), array( 'status' => 500 ) );
        }

        return new WP_REST_Response( array( 'success' => true, 'deleted_id' => $ticket_id ), 200 );
    }

    /**
     * Helper to uniformly translate custom post structure definitions into raw key/value arrays.
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
     * Helper to cleanly structuralize raw taxonomies terms into structured dictionary indexes.
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