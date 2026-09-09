'use strict';

// ============================================================
// Configurações centrais do Controle de Frota – Polícia Penal SP
// ============================================================

const CONFIG = {
  APP_NAME: 'Controle de Frota',
  ORGAO: 'Polícia Penal do Estado de São Paulo',

  // Endereços da API e do arquivo de dados (fallback)
  API_BASE: '/api',
  DATA_FILE: 'data/db.json',

  // Chave do armazenamento local (modo offline/fallback)
  STORAGE_KEY: 'frota_sp_veiculos',

  // Status possíveis de um veículo
  STATUS: {
    DISPONIVEL: 'Disponível',
    EM_USO: 'Em uso',
    MANUTENCAO: 'Manutenção',
    INDISPONIVEL: 'Indisponível'
  },

  // Tipos de veículo aceitos
  TIPOS: [
    'Sedan',
    'Hatch',
    'SUV',
    'Pickup',
    'Van',
    'Ônibus',
    'Caminhão',
    'Moto',
    'Viatura'
  ]
};
