
'use client';

import { useState, useEffect } from 'react';
import NotificationBar from './NotificationBar';

export default function NotificationController() {
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        // This effect runs only on the client side
        if (localStorage.getItem('notificationClosed') !== 'true') {
            setShowNotification(true);
        }
    }, []);

    const handleCloseNotification = () => {
        localStorage.setItem('notificationClosed', 'true');
        setShowNotification(false);
    };

    if (!showNotification) {
        return null;
    }

    return <NotificationBar onClose={handleCloseNotification} />;
}
