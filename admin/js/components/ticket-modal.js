/**
 * Detail Slide-Out Panel Component for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

import { updateTicketDetails } from '../api.js';
import { AppState, router } from '../app.js';

// Local reference cache to track the item actively being modified
let activeTicketInstance = null;

/**
 * 1. INITIALIZE MODAL COMPONENT DOM REFERENCES
 * Binds closing events to the backdrop, structural button elements, and the delete trigger.
 */
export function initTicketModal() {
    const modalOverlay = document.getElementById('va-ticket-modal');
    const closeBtn     = document.getElementById('va-close-modal-btn');
    const deleteBtn    = document.getElementById('va-delete-ticket-btn');

    if (!modalOverlay || !closeBtn) return;

    // Close on explicit 'X' button action
    closeBtn.addEventListener('click', () => closeTicketModal());

    // Close when the background overlay wrapper area is selected directly
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeTicketModal();
        }
    });

    // Wire up click listener for permanent deletion operation
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!activeTicketInstance || !confirm('Permanently delete this requirement tracking node?')) return;
            
            try {
                // Dynamically import deleteTicket to execute destruction request
                const { deleteTicket } = await import('../api.js');
                await deleteTicket(activeTicketInstance.id);
                
                // Wipe out reference from the centralized application state
                const targetIndex = AppState.tickets.findIndex(t => t.id == activeTicketInstance.id);
                if (targetIndex !== -1) {
                    AppState.tickets.splice(targetIndex, 1);
                }
                
                closeTicketModal();
                router(AppState.currentView); // Forces underlying canvas update repaints
            } catch (err) {
                console.error('Operational termination failure encountered:', err);
            }
        });
    }

    // Bind real-time change event loops to handle auto-saving modifications
    initModalAutoSaveListeners();
}

/**
 * 2. OPEN OVERLAY WINDOW VIEW
 * Populates structural input elements matching the targeted asset's data array profile.
 *
 * @param {Object} ticket - Single tracked asset entity block.
 * @param {Object} state - Centralized global data context reference.
 */
export function openTicketModal(ticket, state) {
    activeTicketInstance = ticket;
    
    const modalOverlay = document.getElementById('va-ticket-modal');
    if (!modalOverlay) return;

    // Populate header metadata tags
    document.getElementById('modal-ticket-key').textContent = ticket.key;
    document.getElementById('modal-ticket-title').value     = ticket.title;
    document.getElementById('modal-ticket-desc').value      = ticket.description || '';

    // Populate Right Sidebar Selectors (Taxonomy Options mapping)
    populateSelectOptions('modal-status-select', state.statuses, ticket.status);
    populateSelectOptions('modal-priority-select', state.priorities, ticket.priority);
    
    // Populate simple parent tracking representation loop
    const parentContainer = document.getElementById('modal-parent-select');
    if (parentContainer) {
        parentContainer.innerHTML = '<option value="">None / Independent</option>' + 
            state.tickets
                .filter(t => t.id !== ticket.id)
                .map(t => `<option value="${t.id}" ${ticket.project_id === t.id ? 'selected' : ''}>${t.key} - ${t.title}</option>`)
                .join('');
    }

    // Populate historical activity timeline mockup context
    const streamContainer = document.getElementById('va-modal-activity-stream');
    if (streamContainer) {
        streamContainer.innerHTML = `
            <div class="va-activity-item" style="font-size:12px; padding: 6px 0; border-bottom:1px solid #f0f2f5; color:#646970;">
                <strong>${ticket.author || 'System'}</strong> created this tracker item assignment.
            </div>
        `;
    }

    // Display container layer
    modalOverlay.style.display = 'flex';
    modalOverlay.classList.remove('hidden');
}

/**
 * 3. CLOSE OVERLAY WINDOW VIEW
 * Clears local reference instances and resets the display constraints safely.
 */
export function closeTicketModal() {
    const modalOverlay = document.getElementById('va-ticket-modal');
    if (!modalOverlay) return;

    modalOverlay.classList.add('hidden');
    modalOverlay.style.display = 'none';
    activeTicketInstance = null;
}

/**
 * Helper to dynamically construct dynamic taxonomy option trees.
 */
function populateSelectOptions(elementId, terms, selectedValue) {
    const selectElement = document.getElementById(elementId);
    if (!selectElement) return;

    selectElement.innerHTML = terms.map(term => `
        <option value="${term.slug}" ${term.slug === selectedValue ? 'selected' : ''}>
            ${term.name}
        </option>
    `).join('');
}

/**
 * 4. AUTO-SAVE HANDLER CONFIGURATION
 * Debounces modifications to ensure network streams sync back to the database automatically.
 */
function initModalAutoSaveListeners() {
    const titleInput  = document.getElementById('modal-ticket-title');
    const descInput   = document.getElementById('modal-ticket-desc');
    const statusSel   = document.getElementById('modal-status-select');
    const prioritySel = document.getElementById('modal-priority-select');

    let debounceTimer;
    const triggerTextSave = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            if (!activeTicketInstance) return;
            
            const payload = {
                title: titleInput.value,
                description: descInput.value
            };

            await persistChanges(activeTicketInstance.id, payload);
        }, 800); // 800ms debounce buffer optimization
    };

    if (titleInput) titleInput.addEventListener('input', triggerTextSave);
    if (descInput)  descInput.addEventListener('input', triggerTextSave);

    // Fast tracking taxonomies trigger updates immediately upon selection switch events
    if (statusSel) {
        statusSel.addEventListener('change', async (e) => {
            if (!activeTicketInstance) return;
            await persistChanges(activeTicketInstance.id, { status: e.target.value });
        });
    }

    if (prioritySel) {
        prioritySel.addEventListener('change', async (e) => {
            if (!activeTicketInstance) return;
            await persistChanges(activeTicketInstance.id, { priority: e.target.value });
        });
    }
}

/**
 * Coordinates API updates with the global state object.
 */
async function persistChanges(ticketId, fieldDelta) {
    try {
        // Asynchronously call the API module to commit fields
        const updatedRecord = await updateTicketDetails(ticketId, fieldDelta);
        
        // Find reference index matching current local memory cache
        const cacheIndex = AppState.tickets.findIndex(t => t.id == ticketId);
        if (cacheIndex !== -1) {
            AppState.tickets[cacheIndex] = updatedRecord; // Sync updated database values locally
            router(AppState.currentView); // Refresh background canvas dynamically
        }
    } catch (err) {
        console.error(`Failed to automatically persist tracking state corrections for node: ${ticketId}`, err);
    }
}