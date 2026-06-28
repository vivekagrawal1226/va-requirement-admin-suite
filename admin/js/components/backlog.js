/**
 * Backlog Matrix Component for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

/**
 * Renders the tabular backlog planning layout and its accompanying filters.
 *
 * @param {HTMLElement} container - The wrapper node where the view will be mounted.
 * @param {Object} state - The global application state object.
 */
export function renderBacklog(container, state) {
    // 1. Generate unique option arrays for localized dropdown filters
    const uniqueTypes = ['requirement', 'feature', 'user-story', 'bug', 'task'];

    // 2. Build the structural view template
    container.innerHTML = `
        <div class="va-backlog-container">
            
            <div class="va-filter-strip">
                <div class="va-filter-item">
                    <label for="va-project-filter">Project:</label>
                    <select id="va-project-filter" class="va-select-flat">
                        ${state.projects.map(proj => `
                            <option value="${proj.id}" ${state.activeProject == proj.id ? 'selected' : ''}>
                                ${proj.title}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="va-filter-item">
                    <label for="va-type-filter">Type:</label>
                    <select id="va-type-filter" class="va-select-flat">
                        <option value="">All Types</option>
                        ${uniqueTypes.map(type => `<option value="${type}">${type.toUpperCase()}</option>`).join('')}
                    </select>
                </div>

                <div class="va-filter-item">
                    <label for="va-priority-filter">Priority:</label>
                    <select id="va-priority-filter" class="va-select-flat">
                        <option value="">All Priorities</option>
                        ${state.priorities.map(prio => `<option value="${prio.slug}">${prio.name}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="va-table-wrapper" style="background:#fff; border-radius:6px; border:1px solid #dcdcde; overflow-x:auto;">
                <table class="va-data-table">
                    <thead>
                        <tr>
                            <th style="width: 100px;">Key</th>
                            <th>Title</th>
                            <th style="width: 120px;">Type</th>
                            <th style="width: 100px;">Priority</th>
                            <th style="width: 120px;">Status</th>
                            <th style="width: 150px;">Assignee</th>
                        </tr>
                    </thead>
                    <tbody id="va-backlog-table-body">
                        </tbody>
                </table>
            </div>
        </div>
    `;

    // 3. Populate initial dataset and setup local table interactive event listeners
    const tableBody = document.getElementById('va-backlog-table-body');
    renderTableRows(tableBody, state.tickets, state);
    initLocalFilters(tableBody, state);
}

/**
 * Iterates through filtered assets to output cleanly formatted table row nodes.
 */
function renderTableRows(tableBody, tickets, state) {
    if (!tableBody) return;

    if (tickets.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center; padding:30px; color:#646970; font-style:italic;">
                    No requirements or items match the current filter selection.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = tickets.map(ticket => `
        <tr class="va-table-row" data-id="${ticket.id}">
            <td style="font-weight:600; color:#646970;">${ticket.key}</td>
            <td style="font-weight:500; color:#1d2327;">${ticket.title}</td>
            <td>
                <span class="va-badge va-type-${ticket.status}">
                    ${ticket.status}
                </span>
            </td>
            <td>
                <span class="va-priority va-prio-${ticket.priority}">
                    ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
            </td>
            <td>
                <span style="text-transform: capitalize; font-size:13px; color:#2c3338;">
                    ${ticket.status.replace('-', ' ')}
                </span>
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <div class="va-avatar">${ticket.author ? ticket.author.substring(0, 2).toUpperCase() : 'UA'}</div>
                    <span style="font-size:13px;">${ticket.author || 'Unassigned'}</span>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Binds framework-free event listeners to sub-filters for dynamic visual restructuring.
 */
function initLocalFilters(tableBody, state) {
    const typeFilter = document.getElementById('va-type-filter');
    const priorityFilter = document.getElementById('va-priority-filter');

    const filterAction = () => {
        const selectedType = typeFilter.value;
        const selectedPriority = priorityFilter.value;

        // Run multi-variable criteria check across local cache arrays
        const filteredTickets = state.tickets.filter(ticket => {
            const matchesType = !selectedType || ticket.status === selectedType; // Fallback mapping match
            const matchesPriority = !selectedPriority || ticket.priority === selectedPriority;
            return matchesType && matchesPriority;
        });

        // Trigger dynamic repaint of structural table records matching search constraints
        renderTableRows(tableBody, filteredTickets, state);
    };

    if (typeFilter) typeFilter.addEventListener('change', filterAction);
    if (priorityFilter) priorityFilter.addEventListener('change', filterAction);
}