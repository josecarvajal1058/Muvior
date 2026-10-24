export interface DRSector {
    id: string;
    name: string;
}

export interface DRMunicipality {
    id: string;
    name: string;
    sectors: DRSector[];
}

export interface DRProvince {
    id: string;
    name: string;
    municipalities: DRMunicipality[];
}

export const DR_LOCATIONS: DRProvince[] = [
    {
        id: 'DN', name: 'Distrito Nacional',
        municipalities: [
            { id: 'DN-DN', name: 'Distrito Nacional', sectors: [{ id: 'Piantini', name: 'Piantini' }, { id: 'Naco', name: 'Ensanche Naco' }, { id: 'BellaVista', name: 'Bella Vista' }, { id: 'MiradorSur', name: 'Mirador Sur' }, { id: 'Gazcue', name: 'Gazcue' }, { id: 'Evaristo', name: 'Evaristo Morales' }, { id: 'Cacicazgos', name: 'Los Cacicazgos' }, { id: 'ZonaColonial', name: 'Zona Colonial' }] }
        ]
    },
    { id: 'AZ', name: 'Azua', municipalities: [{ id: 'AZ-AZ', name: 'Azua de Compostela', sectors: [] }] },
    { id: 'BR', name: 'Baoruco', municipalities: [{ id: 'BR-NY', name: 'Neiba', sectors: [] }] },
    { id: 'BH', name: 'Barahona', municipalities: [{ id: 'BH-BH', name: 'Santa Cruz de Barahona', sectors: [] }] },
    { id: 'DA', name: 'Dajabón', municipalities: [{ id: 'DA-DA', name: 'Dajabón', sectors: [] }] },
    { id: 'DU', name: 'Duarte', municipalities: [{ id: 'DU-SF', name: 'San Francisco de Macorís', sectors: [] }] },
    { id: 'EL', name: 'El Seibo', municipalities: [{ id: 'EL-SE', name: 'Santa Cruz de El Seibo', sectors: [] }] },
    { id: 'EP', name: 'Elías Piña', municipalities: [{ id: 'EP-CO', name: 'Comendador', sectors: [] }] },
    { id: 'ES', name: 'Espaillat', municipalities: [{ id: 'ES-MO', name: 'Moca', sectors: [] }] },
    { id: 'HM', name: 'Hato Mayor', municipalities: [{ id: 'HM-HM', name: 'Hato Mayor del Rey', sectors: [] }] },
    { id: 'HMIR', name: 'Hermanas Mirabal', municipalities: [{ id: 'HMIR-SA', name: 'Salcedo', sectors: [] }] },
    { id: 'IN', name: 'Independencia', municipalities: [{ id: 'IN-JI', name: 'Jimaní', sectors: [] }] },
    { id: 'LA', name: 'La Altagracia', municipalities: [{ id: 'LA-HI', name: 'Salvaleón de Higüey', sectors: [] }, { id: 'LA-PU', name: 'Punta Cana / Bávaro', sectors: [] }] },
    { id: 'LR', name: 'La Romana', municipalities: [{ id: 'LR-LR', name: 'La Romana', sectors: [] }] },
    { id: 'LV', name: 'La Vega', municipalities: [{ id: 'LV-LV', name: 'Concepción de La Vega', sectors: [] }, { id: 'LV-JA', name: 'Jarabacoa', sectors: [] }, { id: 'LV-CO', name: 'Constanza', sectors: [] }] },
    { id: 'MT', name: 'María Trinidad Sánchez', municipalities: [{ id: 'MT-NA', name: 'Nagua', sectors: [] }] },
    { id: 'MN', name: 'Monseñor Nouel', municipalities: [{ id: 'MN-BO', name: 'Bonao', sectors: [] }] },
    { id: 'MC', name: 'Monte Cristi', municipalities: [{ id: 'MC-MC', name: 'San Fernando de Monte Cristi', sectors: [] }] },
    { id: 'MP', name: 'Monte Plata', municipalities: [{ id: 'MP-MP', name: 'Monte Plata', sectors: [] }] },
    { id: 'PE', name: 'Pedernales', municipalities: [{ id: 'PE-PE', name: 'Pedernales', sectors: [] }] },
    { id: 'PR', name: 'Peravia', municipalities: [{ id: 'PR-BA', name: 'Baní', sectors: [] }] },
    { id: 'PP', name: 'Puerto Plata', municipalities: [{ id: 'PP-PP', name: 'San Felipe de Puerto Plata', sectors: [] }, { id: 'PP-SO', name: 'Sosúa', sectors: [] }, { id: 'PP-CA', name: 'Cabarete', sectors: [] }] },
    { id: 'SA', name: 'Samaná', municipalities: [{ id: 'SA-SA', name: 'Santa Bárbara de Samaná', sectors: [] }, { id: 'SA-LT', name: 'Las Terrenas', sectors: [] }] },
    { id: 'SC', name: 'San Cristóbal', municipalities: [{ id: 'SC-SC', name: 'San Cristóbal', sectors: [] }, { id: 'SC-HA', name: 'Bajos de Haina', sectors: [] }] },
    { id: 'SJO', name: 'San José de Ocoa', municipalities: [{ id: 'SJO-SJO', name: 'San José de Ocoa', sectors: [] }] },
    { id: 'SJ', name: 'San Juan', municipalities: [{ id: 'SJ-SJ', name: 'San Juan de la Maguana', sectors: [] }] },
    { id: 'SPM', name: 'San Pedro de Macorís', municipalities: [{ id: 'SPM-SPM', name: 'San Pedro de Macorís', sectors: [] }, { id: 'SPM-JU', name: 'Juan Dolio / Guayacanes', sectors: [] }] },
    { id: 'SR', name: 'Sánchez Ramírez', municipalities: [{ id: 'SR-CO', name: 'Cotuí', sectors: [] }] },
    {
        id: 'STG', name: 'Santiago',
        municipalities: [
            { id: 'STG-STG', name: 'Santiago de los Caballeros', sectors: [{ id: 'Centro', name: 'Centro Histórico' }, { id: 'Jardines', name: 'Los Jardines Metropolitanos' }, { id: 'Trinitaria', name: 'La Trinitaria' }, { id: 'VillaOlga', name: 'Villa Olga' }] }
        ]
    },
    { id: 'STR', name: 'Santiago Rodríguez', municipalities: [{ id: 'STR-SI', name: 'Sabaneta', sectors: [] }] },
    {
        id: 'SD', name: 'Santo Domingo',
        municipalities: [
            { id: 'SD-SDE', name: 'Santo Domingo Este', sectors: [{ id: 'AlmaRosa', name: 'Alma Rosa' }, { id: 'EnsancheOzama', name: 'Ensanche Ozama' }, { id: 'SanIsidro', name: 'San Isidro' }] },
            { id: 'SD-SDN', name: 'Santo Domingo Norte', sectors: [{ id: 'VillaMella', name: 'Villa Mella' }, { id: 'SabanaP', name: 'Sabana Perdida' }] },
            { id: 'SD-SDO', name: 'Santo Domingo Oeste', sectors: [{ id: 'Herrera', name: 'Herrera' }] },
            { id: 'SD-LA', name: 'Los Alcarrizos', sectors: [] }
        ]
    },
    { id: 'VA', name: 'Valverde', municipalities: [{ id: 'VA-MA', name: 'Mao', sectors: [] }] },
];

export function getProvinceById(id: string): DRProvince | undefined {
    return DR_LOCATIONS.find(p => p.id === id);
}

export function getMunicipalityById(provId: string, munId: string): DRMunicipality | undefined {
    return getProvinceById(provId)?.municipalities.find(m => m.id === munId);
}

export function getSectorById(provId: string, munId: string, secId: string): DRSector | undefined {
    return getMunicipalityById(provId, munId)?.sectors.find(s => s.id === secId);
}
