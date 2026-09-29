USE bigcapital_tenant_1ay512wmtekovwv;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM AUDIT_LOGS;
DELETE FROM MATCHED_BANK_TRANSACTIONS;
DELETE FROM RECOGNIZED_BANK_TRANSACTIONS;
DELETE FROM BANK_RULE_CONDITIONS;
DELETE FROM BANK_RULES;
DELETE FROM UNCATEGORIZED_CASHFLOW_TRANSACTIONS;
DELETE FROM CASHFLOW_TRANSACTION_LINES;
DELETE FROM CASHFLOW_TRANSACTIONS;
DELETE FROM ACCOUNTS_TRANSACTIONS;
DELETE FROM MANUAL_JOURNALS_ENTRIES;
DELETE FROM MANUAL_JOURNALS;
DELETE FROM SALE_INVOICE_PAYMENT_EFFECTS;
DELETE FROM PAYMENT_RECEIVES_ENTRIES;
DELETE FROM PAYMENT_RECEIVES;
DELETE FROM CREDIT_NOTE_APPLIED_INVOICE;
DELETE FROM REFUND_CREDIT_NOTE_TRANSACTIONS;
DELETE FROM CREDIT_NOTES;
DELETE FROM SALES_INVOICES;
DELETE FROM SALES_RECEIPTS;
DELETE FROM SALES_ESTIMATES;
DELETE FROM BILLS_PAYMENTS_ENTRIES;
DELETE FROM BILLS_PAYMENTS;
DELETE FROM BILL_LOCATED_COST_ENTRIES;
DELETE FROM BILL_LOCATED_COSTS;
DELETE FROM VENDOR_CREDIT_APPLIED_BILL;
DELETE FROM REFUND_VENDOR_CREDIT_TRANSACTIONS;
DELETE FROM VENDOR_CREDITS;
DELETE FROM BILLS;
DELETE FROM EXPENSES_TRANSACTIONS;
DELETE FROM TAX_RATE_TRANSACTIONS;
DELETE FROM TRANSACTIONS_PAYMENT_METHODS;
DELETE FROM SEPA_REMITTANCE_ENTRIES;
DELETE FROM SEPA_REMITTANCES;
DELETE FROM SEPA_MANDATES;
DELETE FROM SII_RECORDS;
DELETE FROM VERIFACTU_DISPATCH;
DELETE FROM VERIFACTU_RECORDS;
DELETE FROM ELECTRONIC_INVOICE_STATUS_EVENTS;
DELETE FROM ELECTRONIC_INVOICE_DOCUMENTS;
DELETE FROM DOCUMENT_LINKS;
DELETE FROM DOCUMENTS;
DELETE FROM INVENTORY_TRANSACTION_META;
DELETE FROM INVENTORY_TRANSACTIONS;
DELETE FROM INVENTORY_COST_LOT_TRACKER;
DELETE FROM INVENTORY_ADJUSTMENTS_ENTRIES;
DELETE FROM INVENTORY_ADJUSTMENTS;
DELETE FROM WAREHOUSES_TRANSFERS_ENTRIES;
DELETE FROM WAREHOUSES_TRANSFERS;
DELETE FROM ITEMS_ENTRIES;
DELETE FROM ITEMS_WAREHOUSES_QUANTITY;
DELETE FROM ITEMS;
DELETE FROM ITEMS_CATEGORIES;
DELETE FROM WAREHOUSES;
DELETE FROM PROJECTS;
DELETE FROM TASKS;
DELETE FROM MEDIA_LINKS;
DELETE FROM MEDIA;

ALTER TABLE ITEMS_CATEGORIES AUTO_INCREMENT = 1;
ALTER TABLE WAREHOUSES AUTO_INCREMENT = 1;
ALTER TABLE ITEMS AUTO_INCREMENT = 1000;
ALTER TABLE INVENTORY_ADJUSTMENTS AUTO_INCREMENT = 1;
ALTER TABLE INVENTORY_ADJUSTMENTS_ENTRIES AUTO_INCREMENT = 1;
ALTER TABLE INVENTORY_TRANSACTIONS AUTO_INCREMENT = 1;

SET @user_id = COALESCE((SELECT MIN(ID) FROM USERS), 1);
SET @inventory_account_id = 1018;
SET @sell_account_id = 1004;
SET @cost_account_id = 1030;
SET @opening_balance_account_id = 1026;
SET @default_tax_rate_id = 4;
SET @now = NOW();

INSERT INTO ITEMS_CATEGORIES
  (ID, NAME, DESCRIPTION, USER_ID, COST_ACCOUNT_ID, SELL_ACCOUNT_ID, INVENTORY_ACCOUNT_ID, COST_METHOD, CREATED_AT, UPDATED_AT)
VALUES
  (1, 'Herramienta manual', 'Martillos, alicates, destornilladores, llaves y herramientas de banco.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (2, 'Herramienta electrica', 'Taladros, amoladoras, sierras, lijadoras y accesorios electricos.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (3, 'Tornilleria y fijacion', 'Tornillos, tacos, tuercas, arandelas, escuadras y anclajes.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (4, 'Pintura y tratamiento', 'Pinturas, esmaltes, barnices, brochas, rodillos y abrasivos.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (5, 'Fontaneria', 'Racores, llaves, flexos, sifones, tubos y consumibles de fontaneria.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (6, 'Electricidad', 'Cables, mecanismos, enchufes, protecciones y material electrico.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (7, 'Jardin y exterior', 'Riego, mangueras, herramientas de jardin y productos de exterior.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now),
  (8, 'Seguridad y EPIs', 'Guantes, gafas, mascarillas, cascos, candados y senalizacion.', @user_id, @cost_account_id, @sell_account_id, @inventory_account_id, 'FIFO', @now, @now);

INSERT INTO WAREHOUSES
  (ID, NAME, CODE, ADDRESS, CITY, COUNTRY, PHONE_NUMBER, EMAIL, WEBSITE, `PRIMARY`, CREATED_AT, UPDATED_AT)
VALUES
  (1, 'Tienda principal', 'TDA', 'Calle Mayor 18', 'Madrid', 'ES', '910000100', 'tienda@ferreteria-demo.local', 'https://ferreteria-demo.local', 1, @now, @now),
  (2, 'Almacen central', 'ALM', 'Poligono Industrial Nave 7', 'Leganes', 'ES', '910000200', 'almacen@ferreteria-demo.local', 'https://ferreteria-demo.local', 0, @now, @now),
  (3, 'Mostrador profesional', 'PRO', 'Avenida del Taller 42', 'Getafe', 'ES', '910000300', 'pro@ferreteria-demo.local', 'https://ferreteria-demo.local', 0, @now, @now);

INSERT INTO ITEMS
  (ID, NAME, TYPE, CODE, SELLABLE, PURCHASABLE, SELL_PRICE, COST_PRICE, COST_ACCOUNT_ID, SELL_ACCOUNT_ID, INVENTORY_ACCOUNT_ID, SELL_DESCRIPTION, PURCHASE_DESCRIPTION, QUANTITY_ON_HAND, LANDED_COST, NOTE, ACTIVE, CATEGORY_ID, USER_ID, CREATED_AT, UPDATED_AT, SELL_TAX_RATE_ID, PURCHASE_TAX_RATE_ID)
VALUES
  (1000, 'Martillo carpintero 500 g', 'inventory', 'HM-MAR-500', 1, 1, 12.950, 6.800, @cost_account_id, @sell_account_id, @inventory_account_id, 'Martillo con mango bimaterial para trabajos de carpinteria.', 'Compra por caja de 12 unidades.', 48.000, 0, 'Producto de alta rotacion.', 1, 1, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1001, 'Alicate universal 180 mm', 'inventory', 'HM-ALI-180', 1, 1, 9.500, 4.900, @cost_account_id, @sell_account_id, @inventory_account_id, 'Alicate universal cromado con empunadura aislada.', 'Proveedor habitual de herramienta manual.', 60.000, 0, NULL, 1, 1, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1002, 'Juego destornilladores 6 piezas', 'inventory', 'HM-DES-006', 1, 1, 14.900, 7.250, @cost_account_id, @sell_account_id, @inventory_account_id, 'Juego plano y Phillips para uso domestico y profesional.', 'Reponer en expositor de mostrador.', 36.000, 0, NULL, 1, 1, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1003, 'Llave inglesa 250 mm', 'inventory', 'HM-LLI-250', 1, 1, 11.750, 5.950, @cost_account_id, @sell_account_id, @inventory_account_id, 'Llave ajustable de acero templado.', NULL, 42.000, 0, NULL, 1, 1, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1004, 'Cutter profesional 18 mm', 'inventory', 'HM-CUT-018', 1, 1, 4.250, 1.600, @cost_account_id, @sell_account_id, @inventory_account_id, 'Cutter con guia metalica y bloqueo automatico.', NULL, 120.000, 0, NULL, 1, 1, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1005, 'Taladro percutor 710 W', 'inventory', 'HE-TAL-710', 1, 1, 59.900, 37.500, @cost_account_id, @sell_account_id, @inventory_account_id, 'Taladro percutor con velocidad variable y maletin.', 'Garantia dos anos.', 18.000, 0, 'Mantener stock minimo 6 uds.', 1, 2, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1006, 'Atornillador bateria 18 V', 'inventory', 'HE-ATO-18V', 1, 1, 89.000, 58.000, @cost_account_id, @sell_account_id, @inventory_account_id, 'Atornillador con dos baterias y cargador rapido.', NULL, 12.000, 0, NULL, 1, 2, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1007, 'Amoladora angular 115 mm', 'inventory', 'HE-AMO-115', 1, 1, 39.950, 24.700, @cost_account_id, @sell_account_id, @inventory_account_id, 'Amoladora compacta para disco de 115 mm.', NULL, 15.000, 0, NULL, 1, 2, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1008, 'Sierra caladora 500 W', 'inventory', 'HE-SIE-500', 1, 1, 47.500, 29.900, @cost_account_id, @sell_account_id, @inventory_account_id, 'Sierra caladora con cambio rapido de hoja.', NULL, 10.000, 0, NULL, 1, 2, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1009, 'Set brocas pared metal madera 15 pz', 'inventory', 'HE-BRO-015', 1, 1, 16.500, 8.300, @cost_account_id, @sell_account_id, @inventory_account_id, 'Surtido de brocas para usos frecuentes.', NULL, 50.000, 0, NULL, 1, 2, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1010, 'Tornillo tirafondo 5x50 caja 200', 'inventory', 'TF-TIR-550', 1, 1, 6.950, 3.100, @cost_account_id, @sell_account_id, @inventory_account_id, 'Caja de tirafondos zincados 5x50 mm.', NULL, 85.000, 0, NULL, 1, 3, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1011, 'Taco nylon 6 mm bolsa 100', 'inventory', 'TF-TAC-006', 1, 1, 3.250, 1.150, @cost_account_id, @sell_account_id, @inventory_account_id, 'Taco de nylon para fijacion ligera.', NULL, 140.000, 0, NULL, 1, 3, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1012, 'Tuerca hexagonal M8 caja 100', 'inventory', 'TF-TUE-M08', 1, 1, 4.600, 1.900, @cost_account_id, @sell_account_id, @inventory_account_id, 'Tuercas metricas zincadas M8.', NULL, 75.000, 0, NULL, 1, 3, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1013, 'Arandela plana M8 caja 200', 'inventory', 'TF-ARA-M08', 1, 1, 3.800, 1.400, @cost_account_id, @sell_account_id, @inventory_account_id, 'Arandela plana zincada M8.', NULL, 90.000, 0, NULL, 1, 3, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1014, 'Escuadra reforzada 60x60', 'inventory', 'TF-ESC-060', 1, 1, 1.950, 0.650, @cost_account_id, @sell_account_id, @inventory_account_id, 'Escuadra reforzada para estanterias y madera.', NULL, 160.000, 0, NULL, 1, 3, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1015, 'Pintura plastica blanca 4 L', 'inventory', 'PT-PIN-B04', 1, 1, 18.900, 10.200, @cost_account_id, @sell_account_id, @inventory_account_id, 'Pintura plastica interior mate blanco.', NULL, 28.000, 0, NULL, 1, 4, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1016, 'Esmalte sintetico negro 750 ml', 'inventory', 'PT-ESM-N75', 1, 1, 9.950, 5.400, @cost_account_id, @sell_account_id, @inventory_account_id, 'Esmalte sintetico brillante color negro.', NULL, 34.000, 0, NULL, 1, 4, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1017, 'Rodillo antigota 22 cm', 'inventory', 'PT-ROD-022', 1, 1, 5.950, 2.250, @cost_account_id, @sell_account_id, @inventory_account_id, 'Rodillo antigota para paredes lisas.', NULL, 70.000, 0, NULL, 1, 4, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1018, 'Brocha universal 40 mm', 'inventory', 'PT-BRO-040', 1, 1, 2.450, 0.850, @cost_account_id, @sell_account_id, @inventory_account_id, 'Brocha universal para esmaltes y barnices.', NULL, 95.000, 0, NULL, 1, 4, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1019, 'Lija grano 120 paquete 10', 'inventory', 'PT-LIJ-120', 1, 1, 4.900, 1.700, @cost_account_id, @sell_account_id, @inventory_account_id, 'Pack de lijas grano 120 para madera y pared.', NULL, 80.000, 0, NULL, 1, 4, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1020, 'Flexo inox lavabo 40 cm', 'inventory', 'FO-FLE-040', 1, 1, 3.950, 1.550, @cost_account_id, @sell_account_id, @inventory_account_id, 'Latiguillo flexible inox para lavabo.', NULL, 65.000, 0, NULL, 1, 5, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1021, 'Sifon extensible lavabo', 'inventory', 'FO-SIF-EXT', 1, 1, 6.500, 2.800, @cost_account_id, @sell_account_id, @inventory_account_id, 'Sifon extensible universal para lavabo.', NULL, 40.000, 0, NULL, 1, 5, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1022, 'Llave escuadra 1/2x3/8', 'inventory', 'FO-LLE-138', 1, 1, 4.750, 2.100, @cost_account_id, @sell_account_id, @inventory_account_id, 'Llave de escuadra cromada para sanitario.', NULL, 58.000, 0, NULL, 1, 5, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1023, 'Cinta teflon 12 m', 'inventory', 'FO-TEF-012', 1, 1, 0.950, 0.280, @cost_account_id, @sell_account_id, @inventory_account_id, 'Rollo de cinta PTFE para juntas roscadas.', NULL, 220.000, 0, NULL, 1, 5, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1024, 'Tubo PVC desague 40 mm 1 m', 'inventory', 'FO-PVC-040', 1, 1, 2.700, 1.050, @cost_account_id, @sell_account_id, @inventory_account_id, 'Tubo PVC evacuacion diametro 40 mm.', NULL, 55.000, 0, NULL, 1, 5, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1025, 'Cable H07V-K 1.5 rojo rollo 100 m', 'inventory', 'EL-CAB-15R', 1, 1, 24.900, 16.400, @cost_account_id, @sell_account_id, @inventory_account_id, 'Rollo de cable flexible H07V-K 1,5 mm rojo.', NULL, 14.000, 0, NULL, 1, 6, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1026, 'Base enchufe schuko blanca', 'inventory', 'EL-ENC-SCH', 1, 1, 3.950, 1.650, @cost_account_id, @sell_account_id, @inventory_account_id, 'Base de enchufe schuko empotrable blanca.', NULL, 85.000, 0, NULL, 1, 6, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1027, 'Interruptor simple blanco', 'inventory', 'EL-INT-SIM', 1, 1, 3.500, 1.450, @cost_account_id, @sell_account_id, @inventory_account_id, 'Interruptor simple empotrable blanco.', NULL, 90.000, 0, NULL, 1, 6, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1028, 'Magnetotermico 16 A curva C', 'inventory', 'EL-MAG-16C', 1, 1, 8.950, 4.900, @cost_account_id, @sell_account_id, @inventory_account_id, 'Interruptor automatico 16 A curva C.', NULL, 32.000, 0, NULL, 1, 6, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1029, 'Regleta 6 tomas con interruptor', 'inventory', 'EL-REG-006', 1, 1, 8.500, 4.200, @cost_account_id, @sell_account_id, @inventory_account_id, 'Regleta de 6 tomas con cable e interruptor.', NULL, 44.000, 0, NULL, 1, 6, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1030, 'Manguera jardin 25 m', 'inventory', 'JD-MAN-025', 1, 1, 19.900, 10.900, @cost_account_id, @sell_account_id, @inventory_account_id, 'Manguera flexible de jardin 25 metros.', NULL, 20.000, 0, NULL, 1, 7, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1031, 'Pistola riego multifuncion', 'inventory', 'JD-PIS-MUL', 1, 1, 7.500, 3.400, @cost_account_id, @sell_account_id, @inventory_account_id, 'Pistola de riego con varios patrones.', NULL, 35.000, 0, NULL, 1, 7, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1032, 'Guante nitrilo talla 9', 'inventory', 'SE-GUA-N09', 1, 1, 3.950, 1.450, @cost_account_id, @sell_account_id, @inventory_account_id, 'Par de guantes de nitrilo para trabajos generales.', NULL, 150.000, 0, NULL, 1, 8, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1033, 'Gafa seguridad transparente', 'inventory', 'SE-GAF-TRA', 1, 1, 4.500, 1.800, @cost_account_id, @sell_account_id, @inventory_account_id, 'Gafa de proteccion transparente antiimpacto.', NULL, 75.000, 0, NULL, 1, 8, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1034, 'Mascarilla FFP2 caja 20', 'inventory', 'SE-MAS-F20', 1, 1, 12.900, 6.100, @cost_account_id, @sell_account_id, @inventory_account_id, 'Caja de 20 mascarillas FFP2.', NULL, 26.000, 0, NULL, 1, 8, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id),
  (1035, 'Candado laton 40 mm', 'inventory', 'SE-CAN-040', 1, 1, 5.750, 2.300, @cost_account_id, @sell_account_id, @inventory_account_id, 'Candado de laton con dos llaves.', NULL, 48.000, 0, NULL, 1, 8, @user_id, @now, @now, @default_tax_rate_id, @default_tax_rate_id);

INSERT INTO ITEMS_WAREHOUSES_QUANTITY (ITEM_ID, WAREHOUSE_ID, QUANTITY_ON_HAND)
SELECT ID, 1, FLOOR(QUANTITY_ON_HAND * 0.45) FROM ITEMS
UNION ALL
SELECT ID, 2, FLOOR(QUANTITY_ON_HAND * 0.40) FROM ITEMS
UNION ALL
SELECT ID, 3, QUANTITY_ON_HAND - FLOOR(QUANTITY_ON_HAND * 0.45) - FLOOR(QUANTITY_ON_HAND * 0.40) FROM ITEMS;

INSERT INTO INVENTORY_ADJUSTMENTS
  (ID, DATE, TYPE, ADJUSTMENT_ACCOUNT_ID, REASON, REFERENCE_NO, DESCRIPTION, USER_ID, PUBLISHED_AT, CREATED_AT, UPDATED_AT, BRANCH_ID, WAREHOUSE_ID)
VALUES
  (1, CURDATE(), 'increment', @opening_balance_account_id, 'Stock inicial ferreteria demo', 'FER-STOCK-INICIAL', 'Carga inicial de inventario de prueba para ferreteria.', @user_id, CURDATE(), @now, @now, NULL, NULL);

INSERT INTO INVENTORY_ADJUSTMENTS_ENTRIES
  (ADJUSTMENT_ID, `INDEX`, ITEM_ID, QUANTITY, COST, VALUE)
SELECT 1, ROW_NUMBER() OVER (ORDER BY ID), ID, QUANTITY_ON_HAND, COST_PRICE, QUANTITY_ON_HAND * COST_PRICE
FROM ITEMS;

INSERT INTO INVENTORY_TRANSACTIONS
  (DATE, DIRECTION, ITEM_ID, QUANTITY, RATE, TRANSACTION_TYPE, TRANSACTION_ID, ENTRY_ID, COST_ACCOUNT_ID, CREATED_AT, UPDATED_AT, WAREHOUSE_ID, BRANCH_ID)
SELECT CURDATE(), 'IN', q.ITEM_ID, q.QUANTITY_ON_HAND, i.COST_PRICE, 'InventoryAdjustment', 1, NULL, @opening_balance_account_id, @now, @now, q.WAREHOUSE_ID, NULL
FROM ITEMS_WAREHOUSES_QUANTITY q
JOIN ITEMS i ON i.ID = q.ITEM_ID
WHERE q.QUANTITY_ON_HAND > 0;

SET FOREIGN_KEY_CHECKS = 1;
