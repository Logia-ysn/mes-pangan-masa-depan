import { logger } from './logger';

export const exportToCSV = (data: Record<string, any>[], filename: string) => {
    if (!data || !data.length) {
        logger.warn('No data to export');
        return;
    }

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle strings with commas or newlines, and null/undefined
                if (value === null || value === undefined) return '';
                if (typeof value === 'string') {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportTableToCSV = (tableId: string, filename: string) => {
    const table = document.getElementById(tableId);
    if (!table) {
        logger.warn(`Table with ID ${tableId} not found`);
        return;
    }

    const rows = table.querySelectorAll('tr');
    const csvData: string[] = [];

    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData: string[] = [];

        cols.forEach(col => {
            // Get text content and clean it up
            let data = (col as HTMLElement).innerText || (col as HTMLElement).textContent || '';
            // Escape double quotes
            data = data.replace(/"/g, '""');
            // Wrap in quotes if it contains comma, newline or quote
            if (data.search(/("|,|\n)/g) >= 0) {
                data = `"${data}"`;
            }
            rowData.push(data);
        });

        csvData.push(rowData.join(','));
    });

    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
