/**
 * Fetch Wrapper for VA-Requirement-Admin-Suite REST API
 *
 * @package va-requirement-suite
 * @author  Vivek Agrawal
 */

/**
 * Generates uniform network headers, including the required security token.
 * This ensures strict administrative authentication across background streams.
 */
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-WP-Nonce': window.vaSuiteGlobals ? window.vaSuiteGlobals.nonce : ''
    };
}

/**
 * Resolves the absolute endpoint destination path dynamically.
 */
function getApiUrl(endpoint) {
    const base = window.vaSuiteGlobals ? window.vaSuiteGlobals.root : '/wp-json/';
    return `${base}va-suite/v1${endpoint}`;
}

/**
 * 1. FETCH INITIALIZATION WORKSPACE DATA
 * Requests projects, available statuses, and priorities to set up the client state.
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

        return await response.json();
    } catch (error) {
        console.error('API Error [fetchWorkspaceData]:', error);
        throw error;
    }
}

/**
 * 2. FETCH TRACKED ASSETS (TICKETS)
 * Pulls workspace records with optional project isolation filtering.
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
 * 3. CREATE NEW WORKSPACE ASSET
 * Submits a fresh payload to insert a requirement, task, or bug into the database.
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
 * 4. UPDATE EXISTING ASSET META FIELDS
 * Pushes localized changes (such as Title or Description) down to a specific record node.
 */
export async function updateTicketDetails(ticketId, updatedFields) {
    try {
        const response = await fetch(getApiUrl(`/tickets/${ticketId}`), {
            method: 'POST',
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
 * 5. UPDATE WORKFLOW STATUS
 * Specialized shorthand pipeline optimized for handling native drag-and-drop actions.
 */
export async function updateTicketStatus(ticketId, targetStatusSlug) {
    return await updateTicketDetails(ticketId, { status: targetStatusSlug });
}

/**
 * 6. DELETE SPECIFIC TRACKING ASSET
 * Permanently removes a tracking asset from the system via REST[cite: 182].
 */
export async function deleteTicket(ticketId) {
    try {
        const response = await fetch(getApiUrl(`/tickets/${ticketId}`), {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Asset removal transaction failed with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [deleteTicket] on ID ${ticketId}:`, error);
        throw error;
    }
}