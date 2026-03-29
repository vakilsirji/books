import { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';

function isStandaloneMode() {
    return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installed, setInstalled] = useState(() => typeof window !== 'undefined' && isStandaloneMode());
    const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa-install-dismissed') === '1');

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };

        const handleInstalled = () => {
            setInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    if (installed || dismissed || !deferredPrompt) {
        return null;
    }

    const install = async () => {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome !== 'accepted') {
            setDismissed(true);
            sessionStorage.setItem('pwa-install-dismissed', '1');
        }
        setDeferredPrompt(null);
    };

    const dismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('pwa-install-dismissed', '1');
    };

    return (
        <section className="install-banner animate-in">
            <div className="install-banner-copy">
                <span className="install-badge"><Smartphone size={14} /> Mobile App Ready</span>
                <strong>Install BookCircle on your phone</strong>
                <p>Get one-tap access, a cleaner full-screen experience, and faster launches from your home screen.</p>
            </div>
            <div className="install-banner-actions">
                <button type="button" className="btn btn-primary install-btn" onClick={install}>
                    <Download size={16} />
                    Install App
                </button>
                <button type="button" className="btn btn-secondary install-dismiss" onClick={dismiss}>
                    Maybe later
                </button>
            </div>
        </section>
    );
}
