/**
 * Parses a date string in 'YYYY-MM-DD' format into a UTC Date object.
 * This prevents timezone-related issues where a date might be shifted by a day.
 * It's robust against invalid inputs, returning an invalid Date object instead of throwing an error.
 * @param dateString The date string to parse.
 * @returns A Date object set to midnight UTC for the given date, or an invalid Date object.
 */
export const parseAsUTC = (dateString: string): Date => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
        return new Date(NaN); // Return an invalid date
    }
    const [year, month, day] = dateString.split('-').map(Number);
    // month is 0-indexed in Date.UTC
    const date = new Date(Date.UTC(year, month - 1, day));
    
    // An additional check to ensure the constructed date is valid, e.g., for "2024-02-31"
    if (isNaN(date.getTime()) || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        return new Date(NaN);
    }

    return date;
};

/**
 * Safely formats a date string into a localized string (pt-BR).
 * It uses parseAsUTC to handle date strings robustly.
 * @param dateString The date string to format.
 * @param options Optional Intl.DateTimeFormatOptions.
 * @returns A formatted date string or a fallback for invalid dates.
 */
export const safeFormatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
    const date = parseAsUTC(dateString);
    if (isNaN(date.getTime())) {
        return 'Data Inválida';
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC',
    };
    return date.toLocaleDateString('pt-BR', { ...defaultOptions, ...options });
};
