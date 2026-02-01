export const printElement = (elementId: string, title?: string) => {
    // Save current title
    const originalTitle = document.title;
    if (title) {
        document.title = title;
    }

    // Add print class to body to trigger CSS overrides
    document.body.classList.add('is-printing');

    // Find the element to print and add a class to it
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('print-visible');
    }

    // Print
    window.print();

    // Cleanup
    document.body.classList.remove('is-printing');
    if (element) {
        element.classList.remove('print-visible');
    }
    document.title = originalTitle;
};

export const printPage = () => {
    window.print();
};
