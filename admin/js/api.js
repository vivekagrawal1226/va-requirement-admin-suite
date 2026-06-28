/**
 * Vanilla Fetch Wrapper for VA-Requirement-Admin-Suite REST API
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

/**
 * Helper to consolidate native fetch headers, including the required WP REST security nonce.
 * This ensures strict admin-only security compliance across asynchronous background streams.
 */
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.vaSuiteGlobals ? window.vaSuiteGlobals.nonce : ''
    };
}

/**
 * Helper to parse the base API entry point path safely from the localized global state.
 */
function getApiUrl(endpoint) {
    const base = window.vaSuiteGlobals ? window.vaSuiteGlobals.root : '/wp-json/';
    // Returns full clean destination path mapping back to custom API namespace
    return `${base}va-suite/v1${endpoint}`;
}

/**
 * 1. FETCH INITIALIZATION WORKSPACE DATA
 * Requests project indexes, status taxonomies, and urgency priority levels in a single loop.
 */
export async function fetchWorkspaceData() {
    try {
        const response = await fetch(getApiUrl('/workspace'), {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Workspace synchronization dropped with status: ${response.status}`);
        }

        return await response.json(); // Serves initialization parameters directly back to app.js
    } catch (error) {
        console.error('API Error [fetchWorkspaceData]:', error);
        throw error;
    }
}

/**
 * 2. FETCH TRACKED ASSET COLLECTIONS (TICKETS)
 * Pulls tracked items from the repository, with optional project boundary isolation constraints.
 */
export async function fetchTickets(projectId = '') {
    try {
        let url = getApiUrl('/tickets');
        if (projectId) {
            url += `?project=${encodeURIComponent(projectId)}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Asset collection sync dropped with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error [fetchTickets]:', error);
        return [];
    }
}

/**
 * 3. CREATE NEW WORKSPACE TRACKED ASSET
 * Submits a fresh payload to the repository database mapping custom post types and taxonomies.
 */
export async function createTicket(ticketData) {
    try {
        const response = await fetch(getApiUrl('/tickets'), {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(ticketData)
        });

        if (!response.ok) {
            throw new Error(`Asset storage mapping failed with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error [createTicket]:', error);
        throw error;
    }
}

/**
 * 4. UPDATE EXISTING ASSET META CHANNELS
 * Pushes general structural changes (such as Title, Descriptions, or Epics) down to specific record nodes.
 */
export async function updateTicketDetails(ticketId, updatedFields) {
    try {
        const response = await fetch(getApiUrl(`/tickets/${ticketId}`), {
            method: 'POST', // Utilizing editable endpoint setup route mappings
            headers: getHeaders(),
            body: JSON.stringify(updatedFields)
        });

        if (!response.ok) {
            throw new Error(`Asset modification transactional update failed with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [updateTicketDetails] on ID ${ticketId}:`, error);
        throw error;
    }
}

/**
 * 5. UPDATE WORKFLOW TAXONOMY STATUS
 * Optimized pipeline specialized for handling native HTML5 Kanban drag-and-drop actions.
 */
export async function updateTicketStatus(ticketId, targetStatusSlug) {
    // Reuses core transactional update payload wrapper architecture
    return await updateTicketDetails(ticketId, { status: targetStatusSlug });
}