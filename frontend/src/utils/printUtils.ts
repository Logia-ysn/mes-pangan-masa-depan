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
    if (!element) {
        console.error(`Element with id ${elementId} not found`);
        document.body.classList.remove('is-printing');
        document.title = originalTitle;
        return;
    }

    element.classList.add('print-visible');

    // Small delay to ensure CSS is applied and layout is recalculated
    setTimeout(() => {
        // Print
        window.print();

        // Cleanup
        document.body.classList.remove('is-printing');
        if (element) {
            element.classList.remove('print-visible');
        }
        document.title = originalTitle;
    }, 100);
};

export const printPage = () => {
    window.print();
};
