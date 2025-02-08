// UI Controller
class DashboardUI {
    constructor() {
        // Navigation elements
        this.prevDayBtn = document.getElementById('prev-day');
        this.nextDayBtn = document.getElementById('next-day');
        this.currentDateSpan = document.getElementById('current-date');
        
        // Chore elements
        this.choreForm = document.getElementById('chore-form');
        this.choresList = document.getElementById('chores-list');
        this.recurrenceSelect = document.getElementById('recurrence-pattern');
        this.recurrenceDays = document.getElementById('recurrence-days');
        
        // Calendar elements
        this.calendarEvents = document.getElementById('calendar-events');
        
        this.initializeEventListeners();
        this.refreshDisplay();
    }

    initializeEventListeners() {
        // Date navigation
        this.prevDayBtn.addEventListener('click', () => this.navigateDay('prev'));
        this.nextDayBtn.addEventListener('click', () => this.navigateDay('next'));
        
        // Chore form submission
        this.choreForm.addEventListener('submit', (e) => this.handleChoreSubmit(e));
        
        // Recurrence pattern changes
        this.recurrenceSelect.addEventListener('change', () => this.toggleRecurrenceDays());
        
        // Handle chore completion
        this.choresList.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') {
                this.handleChoreToggle(e);
            }
        });
    }

    navigateDay(direction) {
        if (direction === 'prev') {
            calendarManager.previousDay();
        } else {
            calendarManager.nextDay();
        }
        this.refreshDisplay();
    }

    async handleChoreSubmit(e) {
        e.preventDefault();
        
        const choreName = document.getElementById('chore-name').value;
        const recurrencePattern = this.recurrenceSelect.value;
        
        // Get selected days for weekly/biweekly patterns
        const recurrenceDays = Array.from(this.recurrenceDays.querySelectorAll('input:checked'))
            .map(checkbox => parseInt(checkbox.value));
        
        const newChore = {
            name: choreName,
            recurrencePattern: recurrencePattern,
            recurrenceDays: recurrenceDays,
            startDate: new Date().toISOString(),
            completed: false
        };
        
        choreManager.addChore(newChore);
        this.choreForm.reset();
        this.refreshDisplay();
    }

    handleChoreToggle(e) {
        const choreId = e.target.dataset.choreId;
        choreManager.toggleChoreComplete(choreId);
        this.refreshDisplay();
    }

    toggleRecurrenceDays() {
        const pattern = this.recurrenceSelect.value;
        this.recurrenceDays.style.display = 
            (pattern === 'weekly' || pattern === 'biweekly') ? 'flex' : 'none';
    }

    refreshDisplay() {
        this.updateDateDisplay();
        this.updateChoresList();
        this.updateCalendarEvents();
    }

    updateDateDisplay() {
        this.currentDateSpan.textContent = calendarManager.formatDate(calendarManager.currentDate);
    }

    updateChoresList() {
        const todayChores = choreManager.getChoresForDate(calendarManager.currentDate);
        this.choresList.innerHTML = todayChores.map(chore => `
            <div class="chore-item ${chore.completed ? 'chore-completed' : ''}">
                <input 
                    type="checkbox" 
                    class="chore-checkbox" 
                    data-chore-id="${chore.id}"
                    ${chore.completed ? 'checked' : ''}
                >
                <span class="chore-name">${chore.name}</span>
                <span class="chore-recurrence">
                    (${this.formatRecurrencePattern(chore)})
                </span>
            </div>
        `).join('');
    }

    formatRecurrencePattern(chore) {
        switch (chore.recurrencePattern) {
            case 'daily':
                return 'Daily';
            case 'weekly':
            case 'biweekly':
                const days = chore.recurrenceDays
                    .map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
                    .join(', ');
                return `${chore.recurrencePattern === 'weekly' ? 'Weekly' : 'Bi-weekly'} on ${days}`;
            case 'monthly':
                return 'Monthly';
            default:
                return 'Custom';
        }
    }

    async updateCalendarEvents() {
        // Placeholder for calendar events - will be replaced with actual Google Calendar data
        this.calendarEvents.innerHTML = `
            <div class="event">
                <span class="event-time">No calendar integration yet</span>
                <p>Calendar events will appear here once Google Calendar is connected.</p>
            </div>
        `;
    }
}

// Initialize the UI when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardUI = new DashboardUI();
});