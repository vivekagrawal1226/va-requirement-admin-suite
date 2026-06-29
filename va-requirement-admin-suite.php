<?php
/**
 * Plugin Name: VA-Requirement-Admin-Suite
 * Plugin URI:  https://agrawalvivek.com/apps/
 * Description: An admin-only requirements and lifecycle management suite built using vanilla HTML, CSS, and JavaScript.
 * Version:     1.1.0
 * Author:      Vivek Agrawal
 * Text Domain: va-requirement-suite
 * License:     GPL2
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class VA_Requirement_Admin_Suite
 * Sets up custom data containers and enqueues modern framework-free frontend script layers.
 */
class VA_Requirement_Admin_Suite {

    /**
     * Constructor to bind all essential initialization hooks.
     */
    public function __construct() {
        // Core Architecture Hooks
        add_action( 'init', array( $this, 'register_custom_post_types' ) );
        add_action( 'init', array( $this, 'register_custom_taxonomies' ) );

        // Admin Management Panel Hooks
        add_action( 'admin_menu', array( $this, 'add_admin_menu_page' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );

        // Load Asynchronous REST API Components
        $this->includes();
    }

    /**
     * Includes backend dependencies required for decoupled communication.
     */
    private function includes() {
        $api_path = plugin_dir_path( __FILE__ ) . 'includes/class-api-endpoints.php';
        if ( file_exists( $api_path ) ) {
            require_once $api_path;
        }
    }

    /**
     * 1. CUSTOM POST TYPE SETUP
     * Registers dedicated data buckets for project spaces and tracked assets.
     */
    public function register_custom_post_types() {
        // Project Entity Container
        register_post_type( 'va_project', array(
            'labels' => array(
                'name'          => __( 'VA Projects', 'va-requirement-suite' ),
                'singular_name' => __( 'VA Project', 'va-requirement-suite' ),
            ),
            'public'              => false,
            'show_ui'             => true,  // Maintained for fallback data-entry visibility
            'show_in_menu'        => false, // Handled asynchronously via the SPA workspace
            'has_archive'         => false,
            'show_in_rest'        => true,  // Exposes data directly to native fetch loops
            'supports'            => array( 'title', 'editor', 'thumbnail' ),
        ) );

        // Unified Tracked Asset (Ticket) Container
        register_post_type( 'va_ticket', array(
            'labels' => array(
                'name'          => __( 'VA Tickets', 'va-requirement-suite' ),
                'singular_name' => __( 'VA Ticket', 'va-requirement-suite' ),
            ),
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => false,
            'has_archive'         => false,
            'show_in_rest'        => true,  // Exposes data endpoints to custom API fetch rules
            'supports'            => array( 'title', 'editor', 'comments', 'author' ),
        ) );
    }

    /**
     * 2. CUSTOM TAXONOMY CONFIGURATION
     * Structuring grouping nodes to filter workflow state, urgency, and hierarchy.
     */
    public function register_custom_taxonomies() {
        // Custom Life Cycle Status
        register_taxonomy( 'va_ticket_status', 'va_ticket', array(
            'labels' => array(
                'name' => __( 'Statuses', 'va-requirement-suite' ),
            ),
            'hierarchical' => true,
            'show_in_rest' => true,
            'show_ui'      => true,
        ) );

        // Priority Classifications
        register_taxonomy( 'va_ticket_priority', 'va_ticket', array(
            'labels' => array(
                'name' => __( 'Priorities', 'va-requirement-suite' ),
            ),
            'hierarchical' => true,
            'show_in_rest' => true,
            'show_ui'      => true,
        ) );

        // Macro Asset Clusters (Epics)
        register_taxonomy( 'va_epic', 'va_ticket', array(
            'labels' => array(
                'name' => __( 'Epics', 'va-requirement-suite' ),
            ),
            'hierarchical' => true,
            'show_in_rest' => true,
            'show_ui'      => true,
        ) );
    }

    /**
     * 3. WORKSPACE MENU HOOK
     * Generates an isolated environment hook accessible strictly to administrators.
     */
    public function add_admin_menu_page() {
        add_menu_page(
            __( 'VA Requirement Suite', 'va-requirement-suite' ),
            __( 'VA Req Suite', 'va-requirement-suite' ),
            'manage_options', // Hard capability guard checking for admin-only privileges
            'va-requirement-suite',
            array( $this, 'render_spa_application_wrapper' ),
            'dashicons-external', // Visual workflow block layout icon representation
            25
        );
    }

    /**
     * 4. WORKSPACE WRAPPER HTML LAYOUT
     * Structural entry-point shell for the dynamic DOM rendering engine.
     */
    public function render_spa_application_wrapper() {
        ?>
        <div class="wrap">
            <div class="va-suite-header" style="margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h2 style="margin: 0 0 15px 0; font-weight: 600;"><?php _e( 'VA Requirement Admin Suite', 'va-requirement-suite' ); ?></h2>
                <nav class="va-suite-nav" style="display: flex; gap: 10px;">
                    <button data-target="dashboard" class="button button-primary va-nav-btn" type="button"><?php _e( 'Dashboard', 'va-requirement-suite' ); ?></button>
                    <button data-target="backlog" class="button va-nav-btn" type="button"><?php _e( 'Backlog', 'va-requirement-suite' ); ?></button>
                    <button data-target="board" class="button va-nav-btn" type="button"><?php _e( 'Agile Board', 'va-requirement-suite' ); ?></button>
                </nav>
            </div>

            <div id="va-suite-app">
                <div id="va-suite-app-view">
                    <p><?php _e( 'Loading workspace components...', 'va-requirement-suite' ); ?></p>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * 5. ENQUEUE SCRIPTS & RESOURCE SPECIFICATIONS
     * Injects custom CSS rulesets and individual JS modules into the specific page scope.
     */
    public function enqueue_admin_assets( $hook ) {
        // Isolation check to make sure scripts load only within this core application screen scope
        if ( 'toplevel_page_va-requirement-suite' !== $hook ) {
            return;
        }

        // Custom Flex & Grid Theme Styles
        wp_enqueue_style( 
            'va-suite-admin-style', 
            plugin_dir_url( __FILE__ ) . 'admin/css/admin-style.css', 
            array(), 
            '1.1.0' 
        );

        // Core App Routing Engine Script
        wp_enqueue_script( 
            'va-suite-app', 
            plugin_dir_url( __FILE__ ) . 'admin/js/app.js', 
            array(), 
            '1.1.0', 
            array( 'in_footer' => true, 'strategy' => 'defer' ) 
        );

        // Add filter hook to allow ES6 modular javascript runtime parsing mechanics
        add_filter( 'script_loader_tag', array( $this, 'add_module_type_attribute' ), 10, 3 );

        // Localizes localized context parameters mapping back tracking APIs safely
        wp_localize_script( 'va-suite-app', 'vaSuiteGlobals', array(
            'root'  => esc_url_raw( rest_url() ),
            'nonce' => wp_create_nonce( 'wp_rest' )
        ) );
    }

    /**
     * Injects type="module" metadata onto the primary enqueued application JavaScript handle.
     */
    public function add_module_type_attribute( $tag, $handle, $src ) {
        if ( 'va-suite-app' === $handle ) {
            $tag = '<script type="module" src="' . esc_url( $src ) . '" defer></script>';
        }
        return $tag;
    }
}

// Instantiate the plugin pipeline
new VA_Requirement_Admin_Suite();