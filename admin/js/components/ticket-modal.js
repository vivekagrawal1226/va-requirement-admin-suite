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
 * Binds closing events to the backdrop and structural button elements.
 */
export function initTicketModal() {
    const modalOverlay = document.getElementById('va-ticket-modal');
    const closeBtn     = document.getElementById('va-close-modal-btn');

    if (!modalOverlay || !closeBtn) return;

    // Close on explicit 'X' button action
    closeBtn.addEventListener('click', () => closeTicketModal());

    // Close when the background overlay wrapper area is selected directly
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeTicketModal();
        }
    });

    // Bind real-time change event loops to handle auto-saving metadata modifications
    initModalAutoSaveListeners();
}

/**
 * 2. OPEN OVERLAY WINDOW VIEW
 * Populates structural input elements matching the targeted asset's data array profile.
 * * @param {Object} ticket - Single tracked asset entity block[cite: 82].
 * @param {Object} state - Centralized global data context reference[cite: 42].
 */
export function openTicketModal(ticket, state) {
    activeTicketInstance = ticket;
    
    const modalOverlay = document.getElementById('va-ticket-modal');
    if (!modalOverlay) return;

    // Populate header metadata tags [cite: 40]
    document.getElementById('modal-ticket-key').textContent = ticket.key[cite: 40];
    document.getElementById('modal-ticket-title').value     = ticket.title[cite: 40];
    document.getElementById('modal-ticket-desc').value      = ticket.description || ''[cite: 40];

    // Populate Right Sidebar Selectors (Taxonomy Options mapping) [cite: 40]
    populateSelectOptions('modal-status-select', state.statuses, ticket.status)[cite: 40];
    populateSelectOptions('modal-priority-select', state.priorities, ticket.priority)[cite: 40];
    
    // Populate simple parent tracking representation loop [cite: 40]
    const parentContainer = document.getElementById('modal-parent-select')[cite: 40];
    if (parentContainer) {
        parentContainer.innerHTML = '<option value="">None / Independent</option>' + 
            state.tickets
                .filter(t => t.id !== ticket.id)
                .map(t => `<option value="${t.id}" ${ticket.project_id === t.id ? 'selected' : ''}>${t.key} - ${t.title}</option>`)
                .join('');
    }

    // Populate historical activity timeline mockup context [cite: 40]
    const streamContainer = document.getElementById('va-modal-activity-stream');
    if (streamContainer) {
        streamContainer.innerHTML = `
            <div class="va-activity-item" style="font-size:12px; padding: 6px 0; border-bottom:1px solid #f0f2f5; color:#646970;">
                <strong>${ticket.author || 'System'}</strong> created this tracker item assignment.
            </div>
        `;
    }

    // Display container layer [cite: 40]
    modalOverlay.style.display = 'flex';
    modalOverlay.classList.remove('hidden'); [cite: 40]
}

/**
 * 3. CLOSE OVERLAY WINDOW VIEW
 * Clear local reference instances and resets the display constraints safely.
 */
export function closeTicketModal() {
    const modalOverlay = document.getElementById('va-ticket-modal');
    if (!modalOverlay) return;

    modalOverlay.classList.add('hidden'); [cite: 40]
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
 * Debounces modifications to ensure network streams sync back to the database automatically[cite: 44, 63].
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

    // Fast tracking taxonomies triggers changes immediately upon selection switch events [cite: 44, 63]
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
 * Coordinates API updates with the global state object[cite: 42, 85].
 */
async function persistChanges(ticketId, fieldDelta) {
    try {
        // Asynchronously call the API module to commit fields [cite: 85]
        const updatedRecord = await updateTicketDetails(ticketId, fieldDelta); [cite: 85]
        
        // Find reference index matching current local memory cache [cite: 82]
        const cacheIndex = AppState.tickets.findIndex(t => t.id == ticketId); [cite: 82]
        if (cacheIndex !== -1) {
            AppState.tickets[cacheIndex] = updatedRecord; // Sync updated database values locally [cite: 82]
            router(AppState.currentView); // Refresh background canvas dynamically [cite: 82]
        }
    } catch (err) {
        console.error(`Failed to automatically persist tracking state corrections for node: ${ticketId}`, err);
    }
}