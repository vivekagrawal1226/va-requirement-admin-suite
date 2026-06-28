/**
 * Core SPA Router & Orchestrator for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

// Import dynamic rendering components (modular vanilla engine)
import { renderDashboard } from './components/dashboard.js';
import { renderBacklog } from './components/backlog.js';
import { renderBoard } from './components/board.js';
import { initTicketModal, openTicketModal } from './components/ticket-modal.js';
import { fetchWorkspaceData, fetchTickets, updateTicketStatus } from './api.js';

/**
 * 1. CENTRALIZED APPLICATION STATE
 * Manages view layer mapping, tracking collections, and current filters[cite: 42].
 */
export const AppState = {
    currentView: 'dashboard', // Default workspace view mapping [cite: 42]
    activeProject: '',        // Selected project filter boundary [cite: 42]
    projects: [],             // Global cache for projects data
    statuses: [],             // Global workflow status taxonomy mapping
    priorities: [],           // Global priority configuration metadata
    tickets: []               // Loaded tracked items state cache [cite: 42]
};

/**
 * 2. APP INITIALIZATION ENTRY POINT
 * Fires on DOM load to populate global configurations and set initial screen state.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch initialization payload from database via native REST API
        const initData = await fetchWorkspaceData();
        AppState.projects = initData.projects || [];
        AppState.statuses = initData.statuses || [];
        AppState.priorities = initData.priorities || [];

        // Pick initial project context if available
        if (AppState.projects.length > 0) {
            AppState.activeProject = AppState.projects[0].id;
        }

        // Initialize reusable UI overlay elements
        initTicketModal();

        // Setup persistent view event bindings
        initNavigation();
        initGlobalEventListeners();

        // Load initial system data and render default view dashboard
        await loadWorkspaceTickets();
        router(AppState.currentView);

    } catch (error) {
        console.error('VA Suite Initialization Failure:', error);
        document.getElementById('va-suite-app-view').innerHTML = `
            <div class="notice notice-error"><p>Failed to initialize workspace data. Please reload.</p></div>
        `;
    }
});

/**
 * 3. GLOBAL WORKSPACE DATA LOADING
 * Triggers fetch state logic to sync active data collections before rendering changes.
 */
async function loadWorkspaceTickets() {
    const viewContainer = document.getElementById('va-suite-app-view');
    if (viewContainer && AppState.tickets.length === 0) {
        viewContainer.innerHTML = '<p class="va-loading-placeholder">Syncing project board state...</p>';
    }
    // Asynchronously call the API module to collect the fresh array payload
    AppState.tickets = await fetchTickets(AppState.activeProject);
}

/**
 * 4. SYSTEM VIEW ROUTER SWITCH
 * Wipes the wrapper view and invokes pure JS script rendering loops[cite: 43].
 */
export function router(targetView) {
    AppState.currentView = targetView;
    const viewContainer = document.getElementById('va-suite-app-view');
    
    if (!viewContainer) return;
    
    // Clear dynamic wrapper node contents [cite: 43]
    viewContainer.innerHTML = '';

    // Route target navigation execution [cite: 43]
    switch (targetView) {
        case 'dashboard':
            renderDashboard(viewContainer, AppState); [cite: 43]
            break;
        case 'backlog':
            renderBacklog(viewContainer, AppState); [cite: 43]
            break;
        case 'board':
            renderBoard(viewContainer, AppState); [cite: 43]
            break;
        default:
            viewContainer.innerHTML = '<p>View layer configuration profile not found.</p>';
    }
    
    // Synced CSS updates mapping structural button states
    updateActiveNavigationStyles(targetView);
}

/**
 * 5. NAVIGATION EVENT ASSIGNMENTS
 * Attaches pure event listening loops targeting specific control bar nodes[cite: 43].
 */
function initNavigation() {
    const navButtons = document.querySelectorAll('.va-nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-target'); [cite: 43]
            if (target && target !== AppState.currentView) {
                router(target);
            }
        });
    });
}

function updateActiveNavigationStyles(activeView) {
    const navButtons = document.querySelectorAll('.va-nav-btn');
    navButtons.forEach(button => {
        if (button.getAttribute('data-target') === activeView) {
            button.classList.add('button-primary');
        } else {
            button.classList.remove('button-primary');
        }
    });
}

/**
 * 6. GLOBAL EVENT DELEGATION
 * Standard vanilla optimization path mapping shared interactivity constraints across dynamic arrays[cite: 44].
 */
function initGlobalEventListeners() {
    const appWrapper = document.getElementById('va-suite-app');
    if (!appWrapper) return;

    // A. Intercept details modal open events (Table row click or card click) [cite: 44, 66]
    appWrapper.addEventListener('click', (e) => {
        const rowTarget = e.target.closest('.va-table-row');
        const cardTarget = e.target.closest('.va-ticket-card');
        const entityTarget = rowTarget || cardTarget;

        if (entityTarget) {
            const ticketId = entityTarget.getAttribute('data-id');
            const selectedTicket = AppState.tickets.find(t => t.id == ticketId);
            if (selectedTicket) {
                openTicketModal(selectedTicket, AppState);
            }
        }
    });

    // B. Handle Global Filter Change triggers (Project selector updates)
    appWrapper.addEventListener('change', async (e) => {
        if (e.target.id === 'va-project-filter') {
            AppState.activeProject = e.target.value;
            await loadWorkspaceTickets();
            router(AppState.currentView); // Force reload view with updated project scope
        }
    });

    // C. HTML5 Drag-and-Drop Global Lifecycle Triggers for Kanban Grid Columns [cite: 44, 64]
    appWrapper.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.va-ticket-card'); [cite: 65]
        if (card) {
            card.classList.add('va-dragging'); [cite: 44]
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
        }
    });

    appWrapper.addEventListener('dragend', (e) => {
        const card = e.target.closest('.va-ticket-card'); [cite: 65]
        if (card) {
            card.classList.remove('va-dragging');
        }
    });

    appWrapper.addEventListener('dragover', (e) => {
        const dropzone = e.target.closest('.va-card-dropzone');
        if (dropzone) {
            e.preventDefault(); // Required authorization loop needed to drop successfully [cite: 44]
        }
    });

    appWrapper.addEventListener('drop', async (e) => {
        const dropzone = e.target.closest('.va-card-dropzone');
        const column = e.target.closest('.va-board-column'); [cite: 64]
        
        if (dropzone && column) {
            e.preventDefault(); [cite: 44]
            const ticketId = e.dataTransfer.getData('text/plain');
            const targetStatus = column.getAttribute('data-status'); [cite: 64]
            
            // Find reference node matching current state configuration cache
            const ticketIndex = AppState.tickets.findIndex(t => t.id == ticketId);
            
            if (ticketIndex !== -1 && AppState.tickets[ticketIndex].status !== targetStatus) {
                const oldStatus = AppState.tickets[ticketIndex].status;
                
                // Optimistic UI state adjustments locally
                AppState.tickets[ticketIndex].status = targetStatus;
                router('board'); // Re-render canvas layout natively

                try {
                    // Fire background fetch pipeline mapping to native WP REST API layers [cite: 57]
                    await updateTicketStatus(ticketId, targetStatus);
                } catch (error) {
                    console.error('Failed processing background drop mapping transaction:', error);
                    // Revert state if background communication fails
                    AppState.tickets[ticketIndex].status = oldStatus;
                    router('board');
                }
            }
        }
    });
}