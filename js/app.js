// Main Application Logic

// State
let state = {
    tickets: [],
    filters: {
        search: '',
        status: 'all',
        type: 'all'
    },
    ticketToDelete: null
};

// DOM Elements
const elements = {
    tableBody: document.getElementById('ticket-table-body'),
    noResults: document.getElementById('no-results'),
    searchInput: document.getElementById('search-input'),
    filterStatus: document.getElementById('filter-status'),
    filterType: document.getElementById('filter-type'),
    btnAddTicket: document.getElementById('btn-add-ticket'),
    btnExport: document.getElementById('btn-export'),
    btnLogout: document.getElementById('btn-logout'),
    userInfo: document.getElementById('user-info'),

    // Add Ticket Modal
    modalOverlay: document.getElementById('modal-overlay'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    addTicketForm: document.getElementById('add-ticket-form'),

    // Delete Confirmation Modal
    deleteModalOverlay: document.getElementById('delete-modal-overlay'),
    btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),

    // QR Code Modal
    qrModalOverlay: document.getElementById('qr-modal-overlay'),
    btnCloseQRModal: document.getElementById('btn-close-qr-modal'),
    qrCodeImage: document.getElementById('qr-code-image'),

    toast: document.getElementById('toast'),
    stats: {
        total: document.getElementById('stat-total-tickets'),
        available: document.getElementById('stat-available'),
        sold: document.getElementById('stat-sold'),
        capacity: document.getElementById('stat-capacity'),
        revenue: document.getElementById('stat-revenue'),
        avgPrice: document.getElementById('stat-avg-price'),
        confirmed: document.getElementById('stat-confirmed'),
        confirmedPercent: document.getElementById('stat-confirmed-percent')
    }
};

// Constants
const TOTAL_CAPACITY = 100;

// Initialization
async function init() {
    // Check authentication
    const isAuthenticated = await TicketManager.checkAuth();
    if (!isAuthenticated) return;

    // Display username
    const username = localStorage.getItem('username');
    if (username && elements.userInfo) {
        elements.userInfo.textContent = `Welcome, ${username}`;
    }

    // Fetch initial data from backend
    state.tickets = await TicketManager.getTickets();
    render();
    setupEventListeners();
}

// Rendering
function render() {
    renderStats();
    renderTable();
}

function renderStats() {
    const tickets = state.tickets;
    const soldCount = tickets.filter(t => t.status !== 'cancelled').length;
    const confirmedCount = tickets.filter(t => t.status === 'confirmed').length;

    // Revenue (only count non-cancelled)
    const revenue = tickets.reduce((sum, t) => {
        return t.status !== 'cancelled' ? sum + t.price : sum;
    }, 0);

    const avgPrice = soldCount > 0 ? Math.round(revenue / soldCount) : 0;

    // Update DOM
    elements.stats.total.textContent = TOTAL_CAPACITY;
    elements.stats.available.textContent = TOTAL_CAPACITY - soldCount;

    elements.stats.sold.textContent = soldCount;
    elements.stats.capacity.textContent = `${Math.round((soldCount / TOTAL_CAPACITY) * 100)}%`;

    elements.stats.revenue.textContent = `GHS ${revenue.toLocaleString()}`;
    elements.stats.avgPrice.textContent = `GHS ${avgPrice}`;

    elements.stats.confirmed.textContent = confirmedCount;
    elements.stats.confirmedPercent.textContent = soldCount > 0
        ? `${Math.round((confirmedCount / soldCount) * 100)}%`
        : '0%';
}

function renderTable() {
    const filtered = filterTickets();

    elements.tableBody.innerHTML = '';

    if (filtered.length === 0) {
        elements.noResults.classList.remove('hidden');
        return;
    }

    elements.noResults.classList.add('hidden');

    filtered.forEach(ticket => {
        const tr = document.createElement('tr');

        // Action Buttons Logic
        let actionButtons = `
            <button class="btn-icon btn-qr" data-id="${ticket.id}" title="View QR Code">
                <i class="fa-solid fa-qrcode"></i>
            </button>
            <button class="btn-icon btn-delete" data-id="${ticket.id}" title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        if (ticket.status === 'pending') {
            actionButtons = `
                <button class="btn-icon btn-confirm" data-id="${ticket.id}" title="Confirm Ticket" style="color: #059669;">
                    <i class="fa-solid fa-check"></i>
                </button>
                ${actionButtons}
            `;
        }

        tr.innerHTML = `
            <td>
                <div class="attendee-name">${ticket.name}</div>
            </td>
            <td>
                <div class="email-text">${ticket.phone || '-'}</div>
            </td>
            <td>
                <span class="badge badge-type">${ticket.type}</span>
            </td>
            <td>
                <strong>GHS ${ticket.price}</strong>
            </td>
            <td>
                <span class="badge badge-status-${ticket.status}">${ticket.status}</span>
            </td>
            <td>
                ${formatDate(ticket.date)}
            </td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    ${actionButtons}
                </div>
            </td>
        `;
        elements.tableBody.appendChild(tr);
    });
}

function filterTickets() {
    return state.tickets.filter(ticket => {
        const searchLower = state.filters.search;
        const matchesSearch = (ticket.name.toLowerCase().includes(searchLower) ||
            (ticket.phone && ticket.phone.toLowerCase().includes(searchLower)));
        const matchesStatus = state.filters.status === 'all' || ticket.status === state.filters.status;
        const matchesType = state.filters.type === 'all' || ticket.type === state.filters.type;

        return matchesSearch && matchesStatus && matchesType;
    });
}

// Actions
function promptDelete(id) {
    state.ticketToDelete = id;
    elements.deleteModalOverlay.classList.remove('hidden');
}

async function confirmDelete() {
    if (state.ticketToDelete) {
        state.tickets = await TicketManager.deleteTicket(state.ticketToDelete);
        render();
        showToast('Ticket deleted successfully');
        closeDeleteModal();
    }
}

async function confirmTicket(id) {
    state.tickets = await TicketManager.confirmTicket(id);
    render();
    showToast('Ticket confirmed successfully! SMS notification sent.');
}

async function showQRCode(id) {
    console.log('Fetching QR code for ticket ID:', id);
    try {
        const qrCode = await TicketManager.getQRCode(id);
        console.log('QR Code data received:', qrCode ? 'Data exists' : 'No data');

        if (qrCode) {
            elements.qrCodeImage.src = qrCode;
            elements.qrModalOverlay.classList.remove('hidden');
            console.log('QR modal displayed');
        } else {
            console.error('QR code is null or undefined');
            showToast('❌ Failed to load QR code - no data received');
        }
    } catch (error) {
        console.error('Error in showQRCode:', error);
        showToast('❌ Error loading QR code: ' + error.message);
    }
}

async function addTicket(e) {
    e.preventDefault();

    // Get phone input and prepend +233
    const phoneInput = document.getElementById('input-phone').value.trim();
    const fullPhone = `+233 ${phoneInput}`;

    const formData = {
        name: document.getElementById('input-name').value,
        phone: fullPhone,
        type: document.getElementById('input-type').value,
        status: document.getElementById('input-status').value,
        price: TicketManager.PRICES[document.getElementById('input-type').value]
    };

    const newTicket = await TicketManager.addTicket(formData);

    if (newTicket) {
        state.tickets.unshift(newTicket);
        elements.addTicketForm.reset();
        closeModal();
        state.tickets = await TicketManager.getTickets();
        render();

        if (formData.status === 'confirmed') {
            showToast('Ticket added successfully! Confirmation SMS sent.');
        } else {
            showToast('Ticket added successfully!');
        }
    }
}

function exportCSV() {
    const headers = ['ID', 'Name', 'Phone', 'Type', 'Price (GHS)', 'Status', 'Purchase Date'];
    const csvHeaders = headers.join(',');

    const rows = state.tickets.map(t => {
        return [
            t.id,
            `"${t.name}"`,
            `"${t.phone || 'N/A'}"`,
            t.type,
            t.price,
            t.status,
            t.date
        ].join(',');
    });

    const stats = [
        '', '', '', 'STATISTICS', '', '', '', '',
        `Total Tickets,${state.tickets.length}`,
        `Confirmed,${state.tickets.filter(t => t.status === 'confirmed').length}`,
        `Pending,${state.tickets.filter(t => t.status === 'pending').length}`,
        `Cancelled,${state.tickets.filter(t => t.status === 'cancelled').length}`,
        `Total Revenue,${state.tickets.reduce((sum, t) => t.status !== 'cancelled' ? sum + t.price : sum, 0)} GHS`
    ];

    const csvContent = [csvHeaders].concat(rows, stats).join("\n");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `dinner_event_tickets_${timestamp}.csv`;
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
        showToast('CSV file downloaded! Check your Downloads folder.');
    } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
        showToast(`✅ ${filename} saved to Downloads folder!`);
    }
}

// UI Helpers
function openModal() {
    elements.modalOverlay.classList.remove('hidden');
    document.getElementById('input-name').focus();
}

function closeModal() {
    elements.modalOverlay.classList.add('hidden');
}

function closeDeleteModal() {
    elements.deleteModalOverlay.classList.add('hidden');
    state.ticketToDelete = null;
}

function closeQRModal() {
    elements.qrModalOverlay.classList.add('hidden');
}

function showToast(message) {
    const toast = elements.toast;
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Event Listeners
function setupEventListeners() {
    elements.searchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value.toLowerCase();
        renderTable();
    });

    elements.filterStatus.addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        renderTable();
    });

    elements.filterType.addEventListener('change', (e) => {
        state.filters.type = e.target.value;
        renderTable();
    });

    elements.btnLogout.addEventListener('click', () => {
        TicketManager.logout();
    });

    elements.btnAddTicket.addEventListener('click', openModal);
    elements.btnCloseModal.addEventListener('click', closeModal);
    elements.btnCancelModal.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) closeModal();
    });

    elements.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
    elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
    elements.deleteModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.deleteModalOverlay) closeDeleteModal();
    });
    elements.btnConfirmDelete.addEventListener('click', confirmDelete);

    elements.btnCloseQRModal.addEventListener('click', closeQRModal);
    elements.qrModalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.qrModalOverlay) closeQRModal();
    });

    elements.addTicketForm.addEventListener('submit', addTicket);
    elements.btnExport.addEventListener('click', exportCSV);

    elements.tableBody.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            promptDelete(deleteBtn.dataset.id);
            return;
        }

        const confirmBtn = e.target.closest('.btn-confirm');
        if (confirmBtn) {
            confirmTicket(confirmBtn.dataset.id);
            return;
        }

        const qrBtn = e.target.closest('.btn-qr');
        if (qrBtn) {
            showQRCode(qrBtn.dataset.id);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
