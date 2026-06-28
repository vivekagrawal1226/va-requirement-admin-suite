/**
 * Project Dashboard Component for VA-Requirement-Admin-Suite
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

/**
 * Renders the dashboard view layout and aggregates active metric cards.
 * * @param {HTMLElement} container - The wrapper node where the view will be mounted.
 * @param {Object} state - The global application state object.
 */
export function renderDashboard(container, state) {
    // 1. Calculate operational metrics asynchronously from the loaded ticket state cache [cite: 42]
    const totalTickets  = state.tickets.length;
    const requirements  = state.tickets.filter(t => t.status === 'requirement' || t.key.includes('REQ')).length; // Fallback pattern matching
    const openBugs      = state.tickets.filter(t => t.status === 'bug' || t.status === 'to-do' && t.priority === 'high').length;
    
    // Compute progress percentage bar logic matching 'done' status metrics [cite: 54, 58]
    const completedTasks = state.tickets.filter(t => t.status === 'done').length;
    const progressPercent = totalTickets > 0 ? Math.round((completedTasks / totalTickets) * 100) : 0;

    // 2. Generate and mount the structural vanilla HTML layout [cite: 56, 58]
    container.innerHTML = `
        <div class="va-dashboard-grid">
            
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

            <div class="va-summary-row">
                <div class="va-kpi-card">
                    <h3>Total Scoped Items</h3>
                    <div class="va-kpi-value">${totalTickets}</div>
                </div>
                <div class="va-kpi-card">
                    <h3>Workspace Progress</h3>
                    <div class="va-kpi-value">${progressPercent}%</div>
                    <div style="background:#dcdcde; height:6px; border-radius:3px; margin-top:8px; overflow:hidden;">
                        <div style="background:#46b450; width:${progressPercent}%; height:100%;"></div>
                    </div>
                </div>
                <div class="va-kpi-card">
                    <h3>Active Blockers / Open Bugs</h3>
                    <div class="va-kpi-value" style="color:#d63638;">${openBugs}</div>
                </div>
                <div class="va-kpi-card">
                    <h3>Completed Nodes</h3>
                    <div class="va-kpi-value" style="color:#46b450;">${completedTasks}</div>
                </div>
            </div>

            <div class="va-dashboard-main">
                
                <div class="va-dashboard-block" style="background:#fff; padding:20px; border-radius:6px; border:1px solid #dcdcde;">
                    <h3 style="margin-top:0; border-bottom:1px solid #f0f2f5; padding-bottom:10px;">Workflow Allocations</h3>
                    <div class="va-status-chart-fallback" style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">
                        ${state.statuses.map(status => {
                            const count = state.tickets.filter(t => t.status === status.slug).length;
                            const barWidth = totalTickets > 0 ? (count / totalTickets) * 100 : 0;
                            return `
                                <div class="va-chart-row" style="display:grid; grid-template-columns: 100px 1fr 40px; align-items:center; gap:10px;">
                                    <span style="font-size:12px; text-transform:uppercase; color:#646970;">${status.name}</span>
                                    <div style="background:#f0f2f5; height:16px; border-radius:4px; overflow:hidden;">
                                        <div style="background:#007cba; width:${barWidth}%; height:100%; transition:width 0.3s ease;"></div>
                                    </div>
                                    <span style="font-weight:600; text-align:right; font-size:13px;">${count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="va-dashboard-block" style="background:#fff; padding:20px; border-radius:6px; border:1px solid #dcdcde;">
                    <h3 style="margin-top:0; border-bottom:1px solid #f0f2f5; padding-bottom:10px;">My Action Items</h3>
                    <div class="va-personal-queue" style="max-height:300px; overflow-y:auto;">
                        ${state.tickets.slice(0, 5).map(ticket => `
                            <div class="va-table-row" data-id="${ticket.id}" style="padding:10px; border-bottom:1px solid #f0f2f5; display:flex; justify-content:between; align-items:center; cursor:pointer;">
                                <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding-right:10px;">
                                    <strong style="color:#646970; font-size:12px; margin-right:5px;">${ticket.key}</strong>
                                    <span style="font-size:13px;">${ticket.title}</span>
                                </div>
                                <span class="va-badge va-type-${ticket.status}" style="font-size:9px; padding:2px 4px; border-radius:3px; flex-shrink:0;">
                                    ${ticket.status}
                                </span>
                            </div>
                        `).join('')}
                        ${state.tickets.length === 0 ? `<p style="color:#646970; font-style:italic; font-size:13px; text-align:center; padding:20px 0;">No items mapped to this tracking container context.</p>` : ''}
                    </div>
                </div>

            </div>
        </div>
    `;
}