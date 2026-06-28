/**
 * Agile Kanban Board Component for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

/**
 * Renders the responsive status column grid layout for the tracking board workspace.
 *
 * @param {HTMLElement} container - The wrapper node where the view will be mounted.
 * @param {Object} state - The global application state object.
 */
export function renderBoard(container, state) {
    // 1. Build the global filter workspace row container layout
    let htmlOutput = `
        <div class="va-board-workspace">
            
            <div class="va-filter-strip">
                <label for="va-project-filter" style="font-weight:600; align-self:center;">Active Project:</label>
                <select id="va-project-filter" class="va-select-flat">
                    ${state.projects.map(proj => `
                        <option value="${proj.id}" ${state.activeProject == proj.id ? 'selected' : ''}>
                            ${proj.title}
                        </option>
                    `).join('')}
                </select>
            </div>

            <div class="va-board-container">
    `;

    // 2. Iterate dynamically over system status taxonomies to compile lanes
    state.statuses.forEach(status => {
        // Filter local state array variables to find tickets mapped to this specific taxonomy column node
        const columnTickets = state.tickets.filter(ticket => ticket.status === status.slug);
        
        htmlOutput += `
            <div class="va-board-column" data-status="${status.slug}">
                <h3>
                    <span>${status.name}</span>
                    <span class="va-counter">${columnTickets.length}</span>
                </h3>
                
                <div class="va-card-dropzone">
                    ${columnTickets.map(ticket => renderBoardCard(ticket)).join('')}
                    
                    ${columnTickets.length === 0 ? `
                        <div class="va-empty-zone-placeholder" style="text-align:center; padding:20px; color:#646970; font-style:italic; font-size:12px; border: 1px dashed #dcdcde; border-radius:4px;">
                            Empty Column
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });

    htmlOutput += `
            </div>
        </div>
    `;

    // 3. Inject parsed string literal payload cleanly onto the DOM interface canvas mount point
    container.innerHTML = htmlOutput;
}

/**
 * Generates an isolated, draggable single card element string template matching active properties.
 *
 * @param {Object} ticket - Single issue tracking object parameters from AppState array.
 */
function renderBoardCard(ticket) {
    // Format presentation parameters securely mapping initials fallback strings
    const userInitials = ticket.author ? ticket.author.substring(0, 2).toUpperCase() : 'UA';
    const localizedPriority = ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : 'Medium';

    return `
        <div class="va-ticket-card" draggable="true" data-id="${ticket.id}" data-key="${ticket.key}">
            <div class="va-card-header">
                <span class="va-badge va-type-${ticket.status}">
                    ${ticket.status.replace('-', ' ')}
                </span>
                
                <span class="va-priority va-prio-${ticket.priority}">
                    ${localizedPriority}
                </span>
            </div>
            
            <h4 class="va-card-title">${ticket.title}</h4>
            
            <div class="va-card-footer">
                <span class="va-card-key">${ticket.key}</span>
                
                <div class="va-avatar" title="Assigned to ${ticket.author || 'Unassigned'}">
                    ${userInitials}
                </div>
            </div>
        </div>
    `;
}