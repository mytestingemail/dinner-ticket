// Data Management Module (Connected to Backend with Authentication)
const TicketManager = {
    // Base URL for API
    API_URL: 'http://localhost:3000/api',

    //Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('authToken');
    },

    // Get headers with auth token
    getHeaders() {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    // Check if user is authenticated
    async checkAuth() {
        const token = this.getAuthToken();
        if (!token) {
            window.location.href = '/';
            return false;
        }

        try {
            const response = await fetch(`${this.API_URL}/auth/check`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('username');
                window.location.href = '/';
                return false;
            }

            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },

    async getTickets() {
        try {
            const response = await fetch(`${this.API_URL}/tickets`, {
                headers: this.getHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return [];
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error fetching tickets:', error);
            return [];
        }
    },

    async addTicket(ticket) {
        try {
            const response = await fetch(`${this.API_URL}/tickets`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(ticket),
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return null;
            }

            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error adding ticket:', error);
            return null;
        }
    },

    async deleteTicket(id) {
        try {
            const response = await fetch(`${this.API_URL}/tickets/${id}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return [];
            }

            // Return updated list
            return await this.getTickets();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            return [];
        }
    },

    async confirmTicket(id) {
        try {
            const response = await fetch(`${this.API_URL}/tickets/${id}/confirm`, {
                method: 'PATCH',
                headers: this.getHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return [];
            }

            return await this.getTickets();
        } catch (error) {
            console.error('Error confirming ticket:', error);
            return [];
        }
    },

    async getQRCode(id) {
        try {
            const response = await fetch(`${this.API_URL}/tickets/${id}/qrcode`, {
                headers: this.getHeaders()
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                return null;
            }

            const result = await response.json();
            return result.qr_code;
        } catch (error) {
            console.error('Error fetching QR code:', error);
            return null;
        }
    },

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        window.location.href = '/';
    },

    // Constants for pricing
    PRICES: {
        'VIP': 250,
        'Standard': 150,
        'Early Bird': 120
    }
};
