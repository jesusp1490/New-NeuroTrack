export interface SurgeryMaterial {
  id: string
  name: string
  quantity: number
  ref?: string // Código de referencia (opcional)
}

export interface SurgeryType {
  id: string
  name: string
  estimatedDuration: number
  materials: SurgeryMaterial[]
}

export const surgeryTypes: SurgeryType[] = [
  {
    id: "tumores_tronco",
    name: "Tumores de Tronco / Ángulo Pontocerebeloso / Fosa Posterior / Neurinoma del Acústico / Meningiomas",
    estimatedDuration: 300,
    materials: [
      { id: "mat1", name: "Electrodos pareados", quantity: 16, ref: "003-400121" },
      { id: "mat2", name: "Electrodos sacacorchos", quantity: 8, ref: "003-400002" },
      { id: "mat3", name: "Electrodos subdérmicos", quantity: 3, ref: "003-400101" },
      { id: "mat4", name: "Hook Wire", quantity: 6, ref: "003-400160-24" },
      { id: "mat5", name: "Electrodo laríngeo", quantity: 1, ref: "4001-00" },
      { id: "mat6", name: "Estimulador monopolar", quantity: 1, ref: "3602-00" },
      { id: "mat7", name: "Estimulador pedicular", quantity: 1, ref: "3603-00" },
      { id: "mat8", name: "Estimulador bipolar", quantity: 1, ref: "3601-00" },
      { id: "mat9", name: "Estimulador acústico", quantity: 1 },
    ],
  },
  {
    id: "tumor_medular",
    name: "Tumor Medular o Vertebral / Tumor Torácico / Dorsal",
    estimatedDuration: 240,
    materials: [
      { id: "mat7", name: "Estimulador pedicular", quantity: 1, ref: "3603-00" },
      { id: "mat2", name: "Electrodos sacacorchos", quantity: 6, ref: "003-400002" },
      { id: "mat1", name: "Electrodos pareados", quantity: 16, ref: "003-400121" },
      { id: "mat3", name: "Electrodos subdérmicos", quantity: 2, ref: "003-400101" },
      { id: "mat10", name: "Electrodos epidurales de 3 contactos", quantity: 2, ref: "CEDL-3PDINX-6" },
    ],
  },
  {
    id: "tiroides",
    name: "Tiroides / Paratiroides",
    estimatedDuration: 180,
    materials: [
      { id: "mat1", name: "Electrodos pareados", quantity: 6, ref: "003-400121" },
      { id: "mat2", name: "Electrodos sacacorchos", quantity: 2, ref: "003-400002" },
      { id: "mat3", name: "Electrodos subdérmicos", quantity: 4, ref: "003-400101" },
      { id: "mat5", name: "Electrodo laríngeo", quantity: 1, ref: "4001-00" },
      { id: "mat7", name: "Estimulador pedicular", quantity: 1, ref: "3603-00" },
      { id: "mat11", name: "Agujas monopolares aisladas", quantity: 2, ref: "9004102" },
      { id: "mat12", name: "Alargaderas reutilizables", quantity: 2, ref: "019-431500" },
      { id: "mat13", name: "Puentes", quantity: 4 },
    ],
  },
  {
    id: "tumor_cerebral",
    name: "Tumor Cerebral / Tumor Insular / Craneotomía",
    estimatedDuration: 360,
    materials: [
      { id: "mat1", name: "Electrodos pareados", quantity: 12, ref: "003-400121" },
      { id: "mat2", name: "Electrodos sacacorchos", quantity: 8, ref: "003-400002" },
      { id: "mat3", name: "Electrodos subdérmicos", quantity: 2, ref: "003-400101" },
      { id: "mat14", name: "Tira cortical", quantity: 1, ref: "MS04R-IP10X-0JF" },
      { id: "mat7", name: "Estimulador pedicular", quantity: 1, ref: "3603-00" },
      { id: "mat15", name: "Estimulador cortical bipolar", quantity: 1, ref: "PNH G2,0/80X2" },
      { id: "mat6", name: "Estimulador monopolar", quantity: 1, ref: "3602-00" },
      { id: "mat16", name: "Sonda aspirador", quantity: 1 },
    ],
  },
  {
    id: "nervio_periferico",
    name: "Cirugía de Nervio Periférico",
    estimatedDuration: 200,
    materials: [
      { id: "mat1", name: "Electrodos pareados", quantity: 16, ref: "003-400121" },
      { id: "mat3", name: "Electrodos subdérmicos", quantity: 2, ref: "003-400101" },
      { id: "mat17", name: "Estimulador de gancho doble", quantity: 1 },
      { id: "mat18", name: "Estimulador de gancho triple", quantity: 1 },
    ],
  },
]

