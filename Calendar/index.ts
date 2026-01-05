import { IInputs, IOutputs } from "./generated/ManifestTypes";
import "./css/tailwind.min.css";
import "./css/style.css";

export class Calendar implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private events: Array<{ uuid: string, start: string, end: string, title: string, details: string, location: string, color: string }>;
    private currentYearMonth  = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    private sampleData = [
        { uuid: '1', start: this.currentYearMonth + '-05', end: this.currentYearMonth + '-05', title: 'Project Deadline', details: 'This is the final deadline for the project submission.', location: 'Online', color: '#FF5733' },
        { uuid: '2', start: this.currentYearMonth + '-10', end: this.currentYearMonth + '-12', title: 'Team Retreat', details: '3-day retreat at the mountains for team bonding and fun activities.', location: 'Mountain Resort', color: '#337BFF' },
        { uuid: '3', start: this.currentYearMonth + '-15', end: this.currentYearMonth + '-16', title: 'Client Presentation', details: 'Important presentation for the new client project.', location: 'Office Meeting Room', color: '#28A745' },
        { uuid: '4', start: this.currentYearMonth + '-25', end: this.currentYearMonth + '-27', title: 'Conference', details: 'Attending industry conference on new technology trends.', location: 'Tech Expo Center', color: '#FFD700' },
        { uuid: '5', start: this.currentYearMonth + '-25', end: this.currentYearMonth + '-26', title: 'Workshop', details: 'Workshop on Power Platform tools and techniques.', location: 'Online Webinar', color: '#28A745' }
    ];
    private sampleDate = this.currentYearMonth + '-25';
    private calendarMonth: string;
    private dateBackgroundColor: string;
    private dateTextColor: string;
    private updatedData: string;
    private notifyOutputChanged: () => void;

    constructor() { }

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.container = container;
        this.updatedData = "";
        this.notifyOutputChanged = notifyOutputChanged;
        this.dateBackgroundColor = context.parameters.dateBackgroundColor.raw ? context.parameters.dateBackgroundColor.raw : "white";
        this.dateTextColor = context.parameters.dateTextColor.raw ? context.parameters.dateTextColor.raw : "black";
        if (window.location.href.includes("localhost")) {
            this.events = this.sampleData;
            this.calendarMonth = context.parameters.calendarDate.raw ? context.parameters.calendarDate.raw : this.sampleDate;
        } else if (context.parameters.calendarData.raw) {
            this.events = context.parameters.calendarData.raw.rows;
            this.calendarMonth = context.parameters.calendarDate.raw || "";
        } else {
            this.events = this.sampleData;
            this.calendarMonth = this.sampleDate;
            console.warn("No roadmap data found in input parameters.");
        }
        this.renderCalendar();
    }

    private isDateInRange(day: number, month: number, year: number, startDate: string, endDate: string): boolean {
        // Use Date.UTC to avoid local timezone offsets
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        const start = new Date(startDate + 'T00:00:00Z'); // Ensure start date is treated as UTC
        const end = new Date(endDate + 'T23:59:59Z'); // Include the entire end date in the range
    
        return currentDate >= start && currentDate <= end;
    }
    
    private renderCalendar(): void {
        this.container.innerHTML = '';
        this.addMonthNavigation();
    
        const today = new Date(this.calendarMonth + 'T00:00:00Z'); // Treat the month as UTC
        const daysInMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0)).getUTCDate();

        const startDay = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1).getUTCDay();

        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendarContainerCustom';
        // Create calendar grid
        const calendar = document.createElement('div');
        calendar.className = 'calendar grid grid-cols-7 gap-1';
    
        // Add empty cells for the days before the start of the month
        for (let i = 0; i < startDay; i++) {
            calendar.appendChild(document.createElement('div'));
        }
    
        // Generate the days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day bg-white shadow-md p-4 relative';
            dayElement.style.backgroundColor = this.dateBackgroundColor;
            dayElement.style.color = this.dateTextColor;
            dayElement.innerHTML = `<div class="text-lg font-bold">${day}</div>`;
    
            // Check for events on this date
            this.events.forEach(event => {
                if (this.isDateInRange(day, today.getUTCMonth() + 1, today.getUTCFullYear(), event.start, event.end)) {
                    const eventElement = document.createElement('div');
                    eventElement.className = 'event';
                    eventElement.style.backgroundColor = event.color;
                    eventElement.style.color = this.getTextColorForBackground(event.color);
                    eventElement.textContent = event.title;
            
                    // Set the data-uuid attribute to associate the event with its data
                    eventElement.setAttribute('data-uuid', event.uuid);
            
                    // Create the event popup
                    const popupElement = document.createElement('div');
                    popupElement.className = 'event-popup';
                    popupElement.innerHTML = `
                        <h4>${event.title}</h4>
                        <p class="custom-nowrap">${event.start} to ${event.end}</p>
                        <p class="custom-nowrap">Details: ${event.details}</p>
                        <p class="custom-nowrap">Location: ${event.location}</p>
                    `;
                    eventElement.appendChild(popupElement);
                    dayElement.appendChild(eventElement);
                }
            });
            
    
            calendar.appendChild(dayElement);
        }

        calendarContainer.appendChild(calendar);
        this.container.appendChild(calendarContainer);
        this.addEventPopupListeners();
    }
    
    private getTextColorForBackground(bgColor: string): string {
        // Helper function to convert hex to RGB
        function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, (_, r: string, g: string, b: string) => r + r + g + g + b + b);
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result
                ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16),
                  }
                : null;
        }
    
        // Helper function to calculate luminance
        function getLuminance(r: number, g: number, b: number): number {
            const [rr, gg, bb] = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
        }
    
        let r: number, g: number, b: number;
    
        // Handle different color formats
        if (bgColor.startsWith('#')) {
            const rgb = hexToRgb(bgColor);
            if (!rgb) throw new Error('Invalid hex color');
            r = rgb.r;
            g = rgb.g;
            b = rgb.b;
        } else if (bgColor.startsWith('rgb')) {
            const rgbMatch = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            if (!rgbMatch) throw new Error('Invalid RGB color');
            r = parseInt(rgbMatch[1]);
            g = parseInt(rgbMatch[2]);
            b = parseInt(rgbMatch[3]);
        } else {
            return '#FFFFFF';
        }
    
        const luminance = getLuminance(r, g, b);
        return luminance > 0.5 ? '#000000' : '#FFFFFF'; // Return black or white
    }
    

    private addEventPopupListeners(): void {
        const eventElements = this.container.querySelectorAll('.event');
        eventElements.forEach(eventElement => {
            eventElement.addEventListener('click', () => {
                const uuid = eventElement.getAttribute('data-uuid');
                const eventData = this.events.find(event => event.uuid === uuid);
                if (eventData) {
                    this.showEditPopup(eventData);
                }
            });
        });
    }

    private showEditPopup(eventData: { uuid: string, start: string, end: string, title: string, details: string, location: string, color: string }): void {
        const formPopup = document.createElement('div');
        formPopup.className = 'popup-form fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center';
        formPopup.innerHTML = `
            <div class="form-content bg-white p-6 rounded-lg shadow-lg">
                <label class="block mb-2">Title: <input type="text" id="edit-title" value="${eventData.title}" class="w-full p-2 border" /></label>
                <label class="block mb-2">Start Date: <input type="date" id="edit-start" value="${eventData.start}" class="w-full p-2 border" /></label>
                <label class="block mb-2">End Date: <input type="date" id="edit-end" value="${eventData.end}" class="w-full p-2 border" /></label>
                <label class="block mb-2">Details: <textarea id="edit-details" class="w-full p-2 border">${eventData.details}</textarea></label>
                <label class="block mb-2">Location: <input type="text" id="edit-location" value="${eventData.location}" class="w-full p-2 border" /></label>
                <div class="flex justify-end mt-4">
                    <button id="save-button" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">Save</button>
                    <button id="cancel-button" class="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                </div>
            </div>
        `;
        this.container.appendChild(formPopup);

        document.getElementById('save-button')?.addEventListener('click', () => {
            eventData.title = (document.getElementById('edit-title') as HTMLInputElement).value;
            eventData.start = (document.getElementById('edit-start') as HTMLInputElement).value;
            eventData.end = (document.getElementById('edit-end') as HTMLInputElement).value;
            eventData.details = (document.getElementById('edit-details') as HTMLTextAreaElement).value;
            eventData.location = (document.getElementById('edit-location') as HTMLInputElement).value;

            this.container.removeChild(formPopup);
            this.renderCalendar();
            this.updatedData = JSON.stringify(eventData);
            this.notifyOutputChanged();
        });

        document.getElementById('cancel-button')?.addEventListener('click', () => {
            this.container.removeChild(formPopup);
        });
    }

    private addMonthNavigation(): void {
        const navContainer = document.createElement('div');
        navContainer.className = 'calendar-nav flex justify-between mb-4';

        const prevButton = document.createElement('button');
        prevButton.textContent = 'Previous';
        prevButton.className = 'bg-gray-300 px-4 py-2 rounded';
        prevButton.addEventListener('click', () => {
            const currentDate = new Date(this.calendarMonth);
            currentDate.setMonth(currentDate.getMonth() - 1);
            this.calendarMonth = currentDate.toISOString().slice(0, 10);
            this.renderCalendar();
        });

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next';
        nextButton.className = 'bg-gray-300 px-4 py-2 rounded';
        nextButton.addEventListener('click', () => {
            const currentDate = new Date(this.calendarMonth);
            currentDate.setMonth(currentDate.getMonth() + 1);
            this.calendarMonth = currentDate.toISOString().slice(0, 10);
            this.renderCalendar();
        });

        navContainer.appendChild(prevButton);
        navContainer.appendChild(nextButton);
        this.container.insertBefore(navContainer, this.container.firstChild);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.dateBackgroundColor = context.parameters.dateBackgroundColor.raw ? context.parameters.dateBackgroundColor.raw : "white";
        this.dateTextColor = context.parameters.dateTextColor.raw ? context.parameters.dateTextColor.raw : "black";
        if (window.location.href.includes("localhost")) {
            this.events = this.sampleData;
            this.calendarMonth =  context.parameters.calendarDate.raw ? context.parameters.calendarDate.raw : this.sampleDate;
        } else if (context.parameters.calendarData.raw) {
            this.events = context.parameters.calendarData.raw.rows.map((row: { uuid: string; }) => ({
                ...row,
                uuid: row.uuid || crypto.randomUUID(), // Ensure unique IDs if not provided
            }));
            this.calendarMonth = context.parameters.calendarDate.raw || "";
        } else {
            this.events = this.sampleData;
            this.calendarMonth = this.sampleDate;
            console.warn("No roadmap data found in input parameters.");
        }
        this.renderCalendar();
    }

    public getOutputs(): IOutputs {
        return { updatedData: this.updatedData };
    }

    public destroy(): void {
        // Cleanup if needed
    }
}

