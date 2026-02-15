import { useState, useEffect } from 'react';
import { factoryApi } from '../services/api';
import { logger } from '../utils/logger';

interface Factory {
    id: number;
    code: string;
    name: string;
}

export const useFactory = () => {
    const [factories, setFactories] = useState<Factory[]>([]);
    const [selectedFactory, setSelectedFactory] = useState<number | null>(() => {
        const saved = localStorage.getItem('selectedFactoryId');
        return saved ? Number(saved) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFactories = async () => {
            try {
                setLoading(true);
                const res = await factoryApi.getAll();
                const data = res.data?.data || res.data || [];
                const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
                setFactories(pmdFactories);

                // Set default if none selected or previous selection not in list
                if (selectedFactory === null) {
                    const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
                    const defaultId = pmd1 ? pmd1.id : (pmdFactories.length > 0 ? pmdFactories[0].id : null);
                    if (defaultId) {
                        setSelectedFactory(defaultId);
                        localStorage.setItem('selectedFactoryId', String(defaultId));
                    }
                }
            } catch (error) {
                logger.error('Error fetching factories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFactories();
    }, []);

    const changeFactory = (id: number | null) => {
        setSelectedFactory(id);
        if (id) {
            localStorage.setItem('selectedFactoryId', String(id));
        } else {
            localStorage.removeItem('selectedFactoryId');
        }
    };

    return {
        factories,
        selectedFactory,
        setSelectedFactory: changeFactory,
        loading,
        selectedFactoryName: factories.find(f => f.id === selectedFactory)?.name
    };
};
