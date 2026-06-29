/**
 * Backlog Matrix Component for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

import { createTicket } from '../api.js';
import { router } from '../app.js';

/**
 * Renders the tabular backlog planning layout and its accompanying inline creation tools.
 *
 * @param {HTMLElement} container - The wrapper node where the view will be mounted.
 * @param {Object} state - The global application state object.
 */
export function renderBacklog(container, state) {
    // Unique classifications used to map functional asset types
    const issueTypes = ['requirement', 'feature', 'user-story', 'bug', 'task'];

    // 1. Build the global HTML structure incorporating filter mechanics and the inline create bar
    container.innerHTML = `
        <div class="va-backlog-container">
            
            <div class="va-filter-strip" style="display: flex; flex-wrap: wrap; gap: 15px; background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #dcdcde; margin-bottom: 15px;">
                <div class="va-filter-item" style="display: flex; align-items: center; gap: 8px;">
                    <label for="va-project-filter" style="font-weight: 600;">Project:</label>
                    <select id="va-project-filter" class="va-select-flat">
                        ${state.projects.map(proj => `
                            <option value="${proj.id}" ${state.activeProject == proj.id ? 'selected' : ''}>
                                ${proj.title}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="va-filter-item" style="display: flex; align-items: center; gap: 8px;">
                    <label for="va-type-filter" style="font-weight: 600;">Type:</label>
                    <select id="va-type-filter" class="va-select-flat">
                        <option value="">All Types</option>
                        ${issueTypes.map(type => `<option value="${type}">${type.toUpperCase()}</option>`).join('')}
                    </select>
                </div>

                <div class="va-filter-item" style="display: flex; align-items: center; gap: 8px;">
                    <label for="va-priority-filter" style="font-weight: 600;">Priority:</label>
                    <select id="va-priority-filter" class="va-select-flat">
                        <option value="">All Priorities</option>
                        ${state.priorities.map(prio => `<option value="${prio.slug}">${prio.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="va-quick-create-bar" style="background: #fff; padding: 15px; border-radius: 6px; border: 1px solid #dcdcde; margin: 15px 0; display: flex; gap: 10px; align-items: center;">
                <input type="text" id="va-new-ticket-title" placeholder="Create new task, bug, or requirement..." style="flex: 1; padding: 8px; border: 1px solid #dcdcde; border-radius: 4px; font-size: 14px;" />
                
                <select id="va-new-ticket-status" style="padding: 8px; border: 1px solid #dcdcde; border-radius: 4px; font-size: 14px;">
                    ${state.statuses.map(s => `<option value="${s.slug}">${s.name}</option>`).join('')}
                </select>
                
                <button type="button" id="va-submit-inline-ticket" class="button button-primary" style="height: 36px;">Add Item</button>
            </div>

            <div class="va-table-wrapper" style="background: #fff; border-radius: 6px; border: 1px solid #dcdcde; overflow-x: auto;">
                <table class="va-data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f6f7f7;">
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 1px solid #dcdcde; width: 100px;">Key</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 1px solid #dcdcde;">Title</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 1px solid #dcdcde; width: 120px;">Type</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 1px solid #dcdcde; width: 100px;">Priority</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 1px solid #dcdcde; width: 120px;">Status</th>
                            <th style="padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 1px solid #dcdcde; width: 150px;">Assignee</th>
                        </tr>
                    </thead>
                    <tbody id="va-backlog-table-body">
                        </tbody>
                </table>
            </div>
        </div>
    `;

    // 2. Resolve target body elements and complete initial cache repaint load
    const tableBody = document.getElementById('va-backlog-table-body');
    renderTableRows(tableBody, state.tickets);

    // 3. Bind event listener to handle the quick inline creation submit action
    document.getElementById('va-submit-inline-ticket').addEventListener('click', async () => {
        const titleInput = document.getElementById('va-new-ticket-title');
        const statusSelect = document.getElementById('va-new-ticket-status');
        
        if (!titleInput || !titleInput.value.trim()) return;

        const newAssetPayload = {
            title: titleInput.value.trim(),
            status: statusSelect.value,
            project_id: state.activeProject,
            priority: 'medium' // Standard initial classification
        };

        try {
            // Async dispatch payload to native WordPress API endpoint layer
            const savedAsset = await createTicket(newAssetPayload);
            
            // Append result directly onto memory cache array and repaint workspace
            state.tickets.push(savedAsset);
            titleInput.value = '';
            router('backlog'); 
        } catch (err) {
            console.error('Failed to append fresh tracker item asset node:', err);
        }
    });

    // 4. Register local sub-filter event binding handlers
    initLocalBacklogFilters(tableBody, state);
}

/**
 * Loops across the context array to output cleanly structured table rows.
 */
function renderTableRows(tableBody, tickets) {
    if (!tableBody) return;

    if (tickets.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px; color: #646970; font-style: italic;">
                    No workspace requirements or tracker items match the current filter selection.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = tickets.map(ticket => `
        <tr class="va-table-row" data-id="${ticket.id}" style="border-bottom: 1px solid #dcdcde; cursor: pointer;">
            <td style="padding: 12px 15px; font-weight: 600; color: #646970;">${ticket.key}</td>
            <td style="padding: 12px 15px; font-weight: 500; color: #1d2327;">${ticket.title}</td>
            <td style="padding: 12px 15px;">
                <span class="va-badge va-type-${ticket.status}">
                    ${ticket.status}
                </span>
            </td>
            <td style="padding: 12px 15px;">
                <span class="va-priority va-prio-${ticket.priority}">
                    ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
            </td>
            <td style="padding: 12px 15px; text-transform: capitalize; color: #2c3338; font-size: 13px;">
                ${ticket.status.replace('-', ' ')}
            </td>
            <td style="padding: 12px 15px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                    <div class="va-avatar" style="width: 24px; height: 24px; border-radius: 50%; background: #cbd5e1; color: #475569; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 10px;">
                        ${ticket.author ? ticket.author.substring(0, 2).toUpperCase() : 'UA'}
                    </div>
                    <span>${ticket.author || 'Unassigned'}</span>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Initializes framework-free change event hooks for immediate client-side filtering.
 */
function initLocalBacklogFilters(tableBody, state) {
    const typeFilter = document.getElementById('va-type-filter');
    const priorityFilter = document.getElementById('va-priority-filter');

    if (!typeFilter || !priorityFilter) return;

    const executeFilterQuery = () => {
        const selectedType = typeFilter.value;
        const selectedPriority = priorityFilter.value;

        // Run client-side constraint assertion across the central state object array cache
        const filteredDataset = state.tickets.filter(ticket => {
            const matchesType = !selectedType || ticket.status === selectedType;
            const matchesPriority = !selectedPriority || ticket.priority === selectedPriority;
            return matchesType && matchesPriority;
        });

        // Trigger dynamic layout repaint on table node entries
        renderTableRows(tableBody, filteredDataset);
    };

    typeFilter.addEventListener('change', executeFilterQuery);
    priorityFilter.addEventListener('change', executeFilterQuery);
}