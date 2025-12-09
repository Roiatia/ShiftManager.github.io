// Shift Manager Application with Weekly Board
class ShiftManager {
    constructor() {
        this.shifts = this.loadShifts();
        this.messages = this.loadMessages();
        this.employees = new Set();
        this.currentWeekStart = this.getWeekStart(new Date());
        this.initializeEventListeners();
        this.updateEmployeeList();
        this.renderWeeklyBoard();
        this.renderMessages();
    }

    // Get the start of the week (Sunday)
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    // Load shifts from localStorage
    loadShifts() {
        const shifts = localStorage.getItem('shifts');
        return shifts ? JSON.parse(shifts) : [];
    }

    // Save shifts to localStorage
    saveShifts() {
        localStorage.setItem('shifts', JSON.stringify(this.shifts));
    }

    // Load messages from localStorage
    loadMessages() {
        const messages = localStorage.getItem('messages');
        return messages ? JSON.parse(messages) : [];
    }

    // Save messages to localStorage
    saveMessages() {
        localStorage.setItem('messages', JSON.stringify(this.messages));
    }

    // Add a message
    addMessage(text) {
        const message = {
            id: Date.now(),
            text,
            timestamp: new Date().toISOString(),
            author: 'Admin'
        };
        this.messages.unshift(message);
        this.saveMessages();
        this.renderMessages();
    }

    // Delete a message
    deleteMessage(id) {
        this.messages = this.messages.filter(msg => msg.id !== id);
        this.saveMessages();
        this.renderMessages();
    }

    // Render messages
    renderMessages() {
        const container = document.getElementById('messagesContainer');

        if (this.messages.length === 0) {
            container.innerHTML = '<p class="no-messages">No messages yet.</p>';
            return;
        }

        container.innerHTML = this.messages.map(msg => `
            <div class="message">
                <div class="message-header">
                    <strong>${msg.author}</strong>
                    <span class="message-time">${this.formatMessageTime(msg.timestamp)}</span>
                </div>
                <div class="message-text">${msg.text}</div>
                <button class="btn-delete-msg" onclick="shiftManager.deleteMessage(${msg.id})">×</button>
            </div>
        `).join('');
    }

    // Format message timestamp
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // Add a shift
    addShift(employeeName, dayOfWeek, timeSlot, position) {
        // Calculate the actual date for the selected day in current week
        const shiftDate = new Date(this.currentWeekStart);
        shiftDate.setDate(shiftDate.getDate() + parseInt(dayOfWeek));

        const shift = {
            id: Date.now(),
            employeeName,
            dayOfWeek: parseInt(dayOfWeek),
            timeSlot,
            position: position || 'Staff',
            weekStart: this.currentWeekStart.toISOString(),
            date: shiftDate.toISOString()
        };

        this.shifts.push(shift);
        this.employees.add(employeeName);
        this.saveShifts();
        this.renderWeeklyBoard();
        this.updateEmployeeList();
        return shift;
    }

    // Delete a shift
    deleteShift(id) {
        this.shifts = this.shifts.filter(shift => shift.id !== id);
        this.saveShifts();
        this.renderWeeklyBoard();
        this.updateEmployeeList();
    }

    // Get shifts for current week
    getCurrentWeekShifts() {
        const weekStart = this.currentWeekStart.toISOString();
        return this.shifts.filter(shift => shift.weekStart === weekStart);
    }

    // Render weekly board
    renderWeeklyBoard() {
        const board = document.getElementById('shiftBoard');
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const timeSlots = ['morning', 'afternoon', 'evening'];
        const weekShifts = this.getCurrentWeekShifts();

        // Update week display
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        document.getElementById('weekDisplay').textContent =
            `Week of ${this.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        let html = '<div class="board-grid">';

        // Header row
        html += '<div class="board-cell header-cell">Time Slot</div>';
        days.forEach((day, index) => {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + index);
            const isToday = this.isToday(date);
            html += `<div class="board-cell header-cell ${isToday ? 'today' : ''}">
                        <div>${day}</div>
                        <div class="date-small">${date.getDate()}/${date.getMonth() + 1}</div>
                     </div>`;
        });

        // Time slot rows
        const slotLabels = {
            morning: '🌅 Morning<br><small>6AM-2PM</small>',
            afternoon: '☀️ Afternoon<br><small>2PM-10PM</small>',
            evening: '🌙 Evening<br><small>10PM-6AM</small>'
        };

        timeSlots.forEach(slot => {
            html += `<div class="board-cell slot-label">${slotLabels[slot]}</div>`;

            days.forEach((day, dayIndex) => {
                const shiftsInSlot = weekShifts.filter(s =>
                    s.dayOfWeek === dayIndex && s.timeSlot === slot
                );

                const date = new Date(this.currentWeekStart);
                date.setDate(date.getDate() + dayIndex);
                const isToday = this.isToday(date);

                html += `<div class="board-cell shift-cell ${isToday ? 'today' : ''}" 
                              data-day="${dayIndex}" 
                              data-slot="${slot}">`;

                if (shiftsInSlot.length > 0) {
                    shiftsInSlot.forEach(shift => {
                        html += `
                            <div class="shift-item">
                                <div class="shift-name">${shift.employeeName}</div>
                                <div class="shift-position">${shift.position}</div>
                                <button class="btn-remove" onclick="shiftManager.deleteShift(${shift.id})">×</button>
                            </div>
                        `;
                    });
                } else {
                    html += '<div class="empty-slot">Empty</div>';
                }

                html += '</div>';
            });
        });

        html += '</div>';
        board.innerHTML = html;
    }

    // Check if date is today
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    // Update employee list
    updateEmployeeList() {
        this.employees.clear();
        this.shifts.forEach(shift => this.employees.add(shift.employeeName));

        const container = document.getElementById('employeeList');

        if (this.employees.size === 0) {
            container.innerHTML = '<p class="no-employees">No employees yet</p>';
            return;
        }

        container.innerHTML = Array.from(this.employees)
            .sort()
            .map(name => `<div class="employee-item">👤 ${name}</div>`)
            .join('');
    }

    // Navigate to previous week
    prevWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
        this.renderWeeklyBoard();
    }

    // Navigate to next week
    nextWeek() {
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
        this.renderWeeklyBoard();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Shift form submission
        const shiftForm = document.getElementById('shiftForm');
        shiftForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const employeeName = document.getElementById('employeeName').value;
            const dayOfWeek = document.getElementById('dayOfWeek').value;
            const timeSlot = document.getElementById('timeSlot').value;
            const position = document.getElementById('position').value;

            this.addShift(employeeName, dayOfWeek, timeSlot, position);
            shiftForm.reset();
            this.showNotification('Shift added successfully!');
        });

        // Message form submission
        const messageForm = document.getElementById('messageForm');
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const messageText = document.getElementById('messageInput').value;
            this.addMessage(messageText);
            messageForm.reset();
        });

        // Week navigation
        document.getElementById('prevWeek').addEventListener('click', () => this.prevWeek());
        document.getElementById('nextWeek').addEventListener('click', () => this.nextWeek());
    }

    // Show notification
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize the shift manager when DOM is loaded
let shiftManager;
document.addEventListener('DOMContentLoaded', () => {
    shiftManager = new ShiftManager();
});
