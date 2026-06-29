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
 * Manages view layer mapping, tracking collections, and current filters.
 */
export const AppState = {
    currentView: 'dashboard', 
    activeProject: '',        
    projects: [],             
    statuses: [],             
    priorities: [],           
    tickets: []               
};

/**
 * 2. APP INITIALIZATION ENTRY POINT
 * Fires on DOM load to populate global configurations and set initial screen state.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Instantly bind UI controls so navigation elements function immediately
    initNavigation();
    initGlobalEventListeners();
    initTicketModal();

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

        // Load initial system data and render default view dashboard
        await loadWorkspaceTickets();
        router(AppState.currentView);

    } catch (error) {
        console.error('VA Suite Initialization Failure:', error);
        const viewContainer = document.getElementById('va-suite-app-view');
        if (viewContainer) {
            viewContainer.innerHTML = `
                <div class="notice notice-error" style="padding: 10px; background: #fff3f3; border-left: 4px solid #d63638; margin-top: 15px;">
                    <p><strong>Workspace Error:</strong> Connection to backend API failed. Check your WordPress Permalinks status.</p>
                </div>
            `;
        }
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
    AppState.tickets = await fetchTickets(AppState.activeProject);
}

/**
 * 4. SYSTEM VIEW ROUTER SWITCH
 * Wipes the wrapper view and invokes pure JS script rendering loops.
 */
export function router(targetView) {
    AppState.currentView = targetView; 
    const viewContainer = document.getElementById('va-suite-app-view');
    
    if (!viewContainer) return;
    
    // Clear dynamic wrapper node contents
    viewContainer.innerHTML = '';

    // Route target navigation execution
    switch (targetView) {
        case 'dashboard':
            renderDashboard(viewContainer, AppState);
            break;
        case 'backlog':
            renderBacklog(viewContainer, AppState);
            break;
        case 'board':
            renderBoard(viewContainer, AppState);
            break;
        default:
            viewContainer.innerHTML = '<p>View layer configuration profile not found.</p>';
    }
    
    // Synced CSS updates mapping structural button states
    updateActiveNavigationStyles(targetView);
}

/**
 * 5. NAVIGATION EVENT ASSIGNMENTS
 * Attaches pure event listening loops targeting specific control bar nodes.
 */
function initNavigation() {
    const navButtons = document.querySelectorAll('.va-nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Using e.currentTarget guarantees you fetch the attribute off the <button> element
            const target = e.currentTarget.getAttribute('data-target');
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
 * Standard vanilla optimization path mapping shared interactivity constraints across dynamic arrays.
 */
function initGlobalEventListeners() {
    const appWrapper = document.getElementById('va-suite-app');
    if (!appWrapper) return;

    // A. Intercept details modal open events (Table row click or card click)
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
            router(AppState.currentView); 
        }
    });

    // C. HTML5 Drag-and-Drop Global Lifecycle Triggers for Kanban Grid Columns
    appWrapper.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.va-ticket-card');
        if (card) {
            card.classList.add('va-dragging');
            e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
        }
    });

    appWrapper.addEventListener('dragend', (e) => {
        const card = e.target.closest('.va-ticket-card');
        if (card) {
            card.classList.remove('va-dragging');
        }
    });

    appWrapper.addEventListener('dragover', (e) => {
        const dropzone = e.target.closest('.va-card-dropzone');
        if (dropzone) {
            e.preventDefault(); 
        }
    });

    appWrapper.addEventListener('drop', async (e) => {
        const dropzone = e.target.closest('.va-card-dropzone');
        const column = e.target.closest('.va-board-column');
        
        if (dropzone && column) {
            e.preventDefault();
            const ticketId = e.dataTransfer.getData('text/plain');
            const targetStatus = column.getAttribute('data-status');
            
            const ticketIndex = AppState.tickets.findIndex(t => t.id == ticketId);
            
            if (ticketIndex !== -1 && AppState.tickets[ticketIndex].status !== targetStatus) {
                const oldStatus = AppState.tickets[ticketIndex].status;
                
                // Optimistic UI state adjustments locally
                AppState.tickets[ticketIndex].status = targetStatus;
                router('board'); 

                try {
                    await updateTicketStatus(ticketId, targetStatus);
                } catch (error) {
                    console.error('Failed processing background drop mapping transaction:', error);
                    AppState.tickets[ticketIndex].status = oldStatus;
                    router('board');
                }
            }
        }
    });
}