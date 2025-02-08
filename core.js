// Data structures for chores and recurrence
class ChoreRecurrence {
    constructor() {
        this.patterns = {
            DAILY: 'daily',
            WEEKLY: 'weekly',
            BIWEEKLY: 'biweekly',
            MONTHLY: 'monthly',
            CUSTOM: 'custom'
        };
        
        // Days of week for selection (0 = Sunday, 6 = Saturday)
        this.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

        // Add custom pattern types
        this.customTypes = {
            EVERY_N_DAYS: 'every_n_days',
            EVERY_N_WEEKS: 'every_n_weeks',
            EVERY_N_MONTHS: 'every_n_months',
            NTH_DAY_OF_MONTH: 'nth_day_of_month',    // e.g., 3rd Thursday
            LAST_DAY_OF_MONTH: 'last_day_of_month'
        };
    }

    // Check if a chore should appear on a given date
    shouldShowChore(chore, targetDate) {
        const choreDate = new Date(chore.startDate);
        
        switch (chore.recurrencePattern) {
            case this.patterns.DAILY:
                return true;
                
            case this.patterns.WEEKLY:
                return chore.recurrenceDays.includes(targetDate.getDay());
                
            case this.patterns.BIWEEKLY:
                const weekDiff = Math.floor(
                    (targetDate - choreDate) / (7 * 24 * 60 * 60 * 1000)
                );
                return weekDiff % 2 === 0 && 
                       chore.recurrenceDays.includes(targetDate.getDay());
                
            case this.patterns.MONTHLY:
                return choreDate.getDate() === targetDate.getDate();
                
            case this.patterns.CUSTOM:
                return this.evaluateCustomPattern(chore, targetDate);
                
            default:
                return false;
        }
    }

    evaluateCustomPattern(chore, targetDate) {
        if (!chore.customPattern) return false;

        const startDate = new Date(chore.startDate);
        
        switch (chore.customPattern.type) {
            case this.customTypes.EVERY_N_DAYS: {
                const daysDiff = Math.floor((targetDate - startDate) / (24 * 60 * 60 * 1000));
                return daysDiff % chore.customPattern.interval === 0;
            }

            case this.customTypes.EVERY_N_WEEKS: {
                const weeksDiff = Math.floor((targetDate - startDate) / (7 * 24 * 60 * 60 * 1000));
                return weeksDiff % chore.customPattern.interval === 0 &&
                       chore.customPattern.days.includes(targetDate.getDay());
            }

            case this.customTypes.EVERY_N_MONTHS: {
                const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 +
                                 (targetDate.getMonth() - startDate.getMonth());
                return monthsDiff % chore.customPattern.interval === 0 &&
                       targetDate.getDate() === startDate.getDate();
            }

            case this.customTypes.NTH_DAY_OF_MONTH: {
                const targetDay = targetDate.getDay();
                const targetWeek = Math.ceil(targetDate.getDate() / 7);
                return targetDay === chore.customPattern.dayOfWeek &&
                       targetWeek === chore.customPattern.weekNumber;
            }

            case this.customTypes.LAST_DAY_OF_MONTH: {
                const lastDay = new Date(targetDate.getFullYear(), 
                                      targetDate.getMonth() + 1, 0).getDate();
                return targetDate.getDate() === lastDay;
            }

            default:
                return false;
        }
    }
}

class ChoreManager {
    constructor() {
        this.chores = [];
        this.recurrenceManager = new ChoreRecurrence();
        this.loadChores();
    }

    addChore(chore) {
        chore.id = Date.now().toString();
        chore.completed = false;
        this.chores.push(chore);
        this.saveChores();
    }

    toggleChoreComplete(id) {
        const chore = this.chores.find(c => c.id === id);
        if (chore) {
            chore.completed = !chore.completed;
            this.saveChores();
        }
    }

    getChoresForDate(date) {
        return this.chores.filter(chore => 
            this.recurrenceManager.shouldShowChore(chore, date)
        );
    }

    saveChores() {
        localStorage.setItem('chores', JSON.stringify(this.chores));
    }

    loadChores() {
        const saved = localStorage.getItem('chores');
        this.chores = saved ? JSON.parse(saved) : [];
    }
}

class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.apiKey = null; // Will be set during initialization
    }

    async initializeGoogleCalendar(apiKey) {
        this.apiKey = apiKey;
        await this.loadGoogleCalendarAPI();
    }

    async loadGoogleCalendarAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                gapi.load('client', async () => {
                    try {
                        await gapi.client.init({
                            apiKey: this.apiKey,
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                        });
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    async getEventsForDate(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            const response = await gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': startOfDay.toISOString(),
                'timeMax': endOfDay.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'orderBy': 'startTime'
            });

            return response.result.items;
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            return [];
        }
    }

    nextDay() {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        return this.currentDate;
    }

    previousDay() {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        return this.currentDate;
    }

    goToDate(date) {
        this.currentDate = new Date(date);
        return this.currentDate;
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    }
}

// Initialize and export managers
const choreManager = new ChoreManager();
const calendarManager = new CalendarManager();

export { choreManager, calendarManager };
