import { useEffect } from 'react';

function useKeyPress(targetKey: string, action: () => void) {
    useEffect(() => {
        function onKeydown(event: KeyboardEvent) {
            // If spacebar is pressed and no input, textarea, or select is focused
            let activeElementTag = document.activeElement?.tagName;

            if (event.code === targetKey && activeElementTag && !['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElementTag)) {
                action();
                event.preventDefault()
            }
        }

        document.addEventListener('keydown', onKeydown);

        return () => {
            document.removeEventListener('keydown', onKeydown);
        };
    }, [targetKey, action]);
}

export default useKeyPress;