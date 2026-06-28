<?php
/**
 * Admin Menu and Layout View Layer for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class VA_Suite_Admin_Menu
 * Responsible for the structural layout of the admin wrapper page and the dynamic tab router navigation.
 */
class VA_Suite_Admin_Menu {

    /**
     * Constructor to hook navigation registration.
     */
    public function __construct() {
        add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
    }

    /**
     * Registers the dedicated top-level application suite workspace menu in the sidebar.
     * Restricted entirely to users with administrative management capabilities.
     */
    public function register_admin_menu() {
        add_menu_page(
            __( 'VA Requirement Suite', 'va-requirement-suite' ),
            __( 'VA Req Suite', 'va-requirement-suite' ),
            'manage_options', // Admin-only capability guardrail
            'va-requirement-suite',
            array( $this, 'render_workspace_wrapper' ),
            'dashicons-external', // Structural block icon layout representational hook
            25
        );
    }

    /**
     * Outputs the semantic HTML shell structure for the framework-free single page application interface.
     * Your modular vanilla JS router component will inject template literals into these view container nodes.
     */
    public function render_workspace_wrapper() {
        ?>
        <div class="wrap va-suite-wrapper">
            
            <div class="va-suite-header" style="margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div class="va-suite-title-area" style="margin-bottom: 15px;">
                    <h2 style="margin: 0; font-weight: 600; font-size: 23px; color: #1d2327;">
                        <?php _e( 'VA Requirement Admin Suite', 'va-requirement-suite' ); ?>
                    </h2>
                </div>
                
                <nav class="va-suite-nav" style="display: flex; gap: 10px;">
                    <button data-target="dashboard" class="button button-primary va-nav-btn" type="button">
                        <?php _e( 'Dashboard', 'va-requirement-suite' ); ?>
                    </button>
                    <button data-target="backlog" class="button va-nav-btn" type="button">
                        <?php _e( 'Backlog', 'va-requirement-suite' ); ?>
                    </button>
                    <button data-target="board" class="button va-nav-btn" type="button">
                        <?php _e( 'Agile Board', 'va-requirement-suite' ); ?>
                    </button>
                </nav>
            </div>

            <div id="va-suite-app">
                <div id="va-suite-app-view">
                    <p class="va-loading-placeholder">
                        <?php _e( 'Initializing administrative workspace modules...', 'va-requirement-suite' ); ?>
                    </p>
                </div>
            </div>

            <div id="va-ticket-modal" class="va-modal-overlay hidden" style="display: none;">
                <div class="va-modal-content">
                    <header class="va-modal-header">
                        <span id="modal-ticket-key" class="va-modal-key-badge"></span>
                        <button type="button" class="va-close-modal" id="va-close-modal-btn">&times;</button>
                    </header>
                    
                    <div class="va-modal-body">
                        <main class="va-modal-main">
                            <div class="va-input-group">
                                <label for="modal-ticket-title"><?php _e( 'Asset Name / Title', 'va-requirement-suite' ); ?></label>
                                <input type="text" id="modal-ticket-title" class="va-input-flat" />
                            </div>
                            
                            <div class="va-input-group" style="margin-top: 15px;">
                                <label for="modal-ticket-desc"><?php _e( 'Description & Acceptance Criteria', 'va-requirement-suite' ); ?></label>
                                <textarea id="modal-ticket-desc" class="va-textarea-flat" rows="8"></textarea>
                            </div>
                            
                            <div class="va-comments-section" style="margin-top: 20px;">
                                <h3><?php _e( 'Activity & Log History', 'va-requirement-suite' ); ?></h3>
                                <div id="va-modal-activity-stream"></div>
                            </div>
                        </main>

                        <aside class="va-modal-sidebar">
                            <div class="va-meta-group">
                                <label for="modal-status-select"><?php _e( 'Workflow Status', 'va-requirement-suite' ); ?></label>
                                <select id="modal-status-select"></select>
                            </div>

                            <div class="va-meta-group" style="margin-top: 15px;">
                                <label for="modal-priority-select"><?php _e( 'Urgency / Priority', 'va-requirement-suite' ); ?></label>
                                <select id="modal-priority-select"></select>
                            </div>

                            <div class="va-meta-group" style="margin-top: 15px;">
                                <label for="modal-parent-select"><?php _e( 'Parent / Epic Aggregation', 'va-requirement-suite' ); ?></label>
                                <select id="modal-parent-select"></select>
                            </div>
                            
                            <div class="va-meta-group" style="margin-top: 15px;">
                                <label><?php _e( 'Operational Logging', 'va-requirement-suite' ); ?></label>
                                <div id="modal-time-tracking-summary" style="font-size: 12px; line-color: #646970; background: #f6f7f7; padding: 8px; border-radius: 4px;">
                                    </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

        </div>
        <?php
    }
}

// Instantiate the administrative workspace layout manager layer
new VA_Suite_Admin_Menu();