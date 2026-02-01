/**
 * Formats a Date object or string to ID date format (e.g., "Senin, 1 Januari 2023")
 */
export const formatDate = (date: string | Date | undefined, includeTime: boolean = false): string => {
    if (!date) return '-';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return d.toLocaleDateString('id-ID', options);
};

/**
 * Formats a number to ID currency/decimal format
 */
export const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Formats a number as IDR currency
 */
export const formatCurrency = (amount: number | undefined | null): string => {
    if (amount === undefined || amount === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
};
