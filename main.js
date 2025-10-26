// Importy Firebase
import { db } from './firebase-init.js';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    getDoc,
    startAfter
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Import dla CSV
import Papa from 'https://unpkg.com/papaparse@5.4.1/papaparse.min.js';

// --- ELEMENTY GLOBALNE ---
let currentClientId = null;
let currentMachineId = null;
let currentZlecenieId = null;
let currentMagazynItemId = null;
let currentEditClientId = null; // Dla edycji klienta
let currentEditMachineId = null; // Dla edycji maszyny
let calendar; // Instancja kalendarza FullCalendar
let activePartsToRemove = []; // Lista części do usunięcia ze stanu w modalu zakończenia zlecenia

// --- REFERENCJE DO KOLEKCJI FIREBASE ---
const clientsCol = collection(db, 'clients');
const machinesCol = collection(db, 'machines');
const ordersCol = collection(db, 'orders');
const partsCol = collection(db, 'products'); // Zmieniono z 'parts' na 'products'
const eventsCol = collection(db, 'events'); // Dla kalendarza

// --- REFERENCJE DO ELEMENTÓW HTML ---
// Zakładki
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Formularz Klientów
const klientForm = document.getElementById('klient-form');
const klientNazwaInput = document.getElementById('klient-nazwa');
const klientNipInput = document.getElementById('klient-nip');
const klientAdresInput = document.getElementById('klient-adres');
const klientTelefonInput = document.getElementById('klient-telefon');
const listaKlientowUl = document.getElementById('lista-klientow');

// Formularz Maszyn
const maszynaForm = document.getElementById('maszyna-form');
const maszynaKlientSelect = document.getElementById('maszyna-klient-select');
const maszynaTypSelect = document.getElementById('maszyna-typ');
const maszynaModelInput = document.getElementById('maszyna-model');
const maszynaSerialInput = document.getElementById('maszyna-serial');
const maszynaRokInput = document.getElementById('maszyna-rok');
const maszynaMthInput = document.getElementById('maszyna-mth');
const listaMaszynDiv = document.getElementById('lista-maszyn');

// Formularz Zleceń
const zlecenieForm = document.getElementById('zlecenie-form');
const zlecenieKlientSelect = document.getElementById('zlecenie-klient-select');
const zlecenieMaszynaSelect = document.getElementById('zlecenie-maszyna-select');
const nrZleceniaInput = document.getElementById('nr-zlecenia');
const opisUsterkiTextarea = document.getElementById('opis-usterki');
const motogodzinyInput = document.getElementById('motogodziny');
const aktywneZleceniaDiv = document.getElementById('aktywne-zlecenia-lista');
const szukajZleceniaInput = document.getElementById('szukaj-zlecenia');
const ukończoneZleceniaLista = document.getElementById('ukonczone-zlecenia-lista');
const miesiacSummaryInput = document.getElementById('miesiac-summary');
const summaryContainer = document.getElementById('summary-container');
const exportZleceniaBtn = document.getElementById('export-zlecenia-btn');
const toggleUkonczoneBtn = document.getElementById('toggle-ukonczone');
const collapsibleContent = document.querySelector('#toggle-ukonczone + .collapsible-content');


// Formularz Magazyn
const magazynForm = document.getElementById('magazyn-form');
const itemIndexInput = document.getElementById('item-index');
const itemNameInput = document.getElementById('item-name');
const itemIloscInput = document.getElementById('item-ilosc');
const itemKlientInput = document.getElementById('item-klient');
const magazynListaTbody = document.getElementById('magazyn-lista');

// Formularz Masowego Dodawania Produktów
const bulkAddForm = document.getElementById('bulk-add-form');
const bulkKlientInput = document.getElementById('bulk-klient');
const bulkItemsTextarea = document.getElementById('bulk-items');

// Zarządzanie Olejami
const oilTypeSelect = document.getElementById('oil-type');
const oilContainerSizeSelect = document.getElementById('oil-container-size');
const addOilBtn = document.getElementById('add-oil-btn');
const converterLitryInput = document.getElementById('converter-litry');
const resultSztukiSpan = document.getElementById('result-sztuki');
const converterSztukiInput = document.getElementById('converter-sztuki');
const resultLitrySpan = document.getElementById('result-litry');

// Modale
const kalendarzModal = document.getElementById('kalendarz-modal');
const kalendarzModalTitle = document.getElementById('kalendarz-modal-title');
const kalendarzForm = document.getElementById('kalendarz-form');
const kalendarzDataInput = document.getElementById('kalendarz-data');
const godzinyPracyInput = document.getElementById('godziny-pracy');
const godzinyWyfakturowaneInput = document.getElementById('godziny-fakturowane');
const nadgodzinyInput = document.getElementById('nadgodziny');
const godzinyJazdyInput = document.getElementById('godziny-jazdy');
const kalendarzNotatkaInput = document.getElementById('kalendarz-notatka');

const completeZlecenieModal = document.getElementById('complete-zlecenie-modal');
const completeZlecenieForm = document.getElementById('complete-zlecenie-form');
const completeZlecenieIdInput = document.getElementById('complete-zlecenie-id');
const modalZlecenieNazwaSpan = document.getElementById('modal-zlecenie-nazwa');
const wyfakturowaneGodzinyInput = document.getElementById('wyfakturowane-godziny');
const typZleceniaSelect = document.getElementById('typ-zlecenia');
const modalMagazynListaDiv = document.getElementById('modal-magazyn-lista');
const partsToRemoveListUl = document.getElementById('parts-to-remove-list');

const stockChangeModal = document.getElementById('stock-change-modal');
const stockModalTitle = document.getElementById('stock-modal-title');
const stockChangeForm = document.getElementById('stock-change-form');
const stockChangeIdInput = document.getElementById('stock-change-id');
const stockModalNameSpan = document.getElementById('stock-modal-name');
const stockModalCurrentQtySpan = document.getElementById('stock-modal-current-qty');
const stockChangeQtyInput = document.getElementById('stock-change-qty');

const assignZlecenieModal = document.getElementById('assign-zlecenie-modal');
const assignZlecenieForm = document.getElementById('assign-zlecenie-form');
const assignZlecenieIdInput = document.getElementById('assign-zlecenie-id');
const assignZlecenieOpisSpan = document.getElementById('assign-zlecenie-opis');
const assignKlientSelect = document.getElementById('assign-klient-select');
const assignNowyKlientInput = document.getElementById('assign-nowy-klient');
const assignMachineSection = document.getElementById('assign-machine-section');
const assignMaszynaSelect = document.getElementById('assign-maszyna-select');
const assignNowaMaszynaTypSelect = document.getElementById('assign-nowa-maszyna-typ');
const assignNowaMaszynaModelInput = document.getElementById('assign-nowa-maszyna-model');

const editKlientModal = document.getElementById('edit-klient-modal');
const editKlientForm = document.getElementById('edit-klient-form');
const editKlientIdInput = document.getElementById('edit-klient-id');
const editKlientNazwaInput = document.getElementById('edit-klient-nazwa');
const editKlientNipInput = document.getElementById('edit-klient-nip');
const editKlientAdresInput = document.getElementById('edit-klient-adres');
const editKlientTelefonInput = document.getElementById('edit-klient-telefon');

const editMaszynaModal = document.getElementById('edit-maszyna-modal');
const editMaszynaForm = document.getElementById('edit-maszyna-form');
const editMaszynaIdInput = document.getElementById('edit-maszyna-id');
const editMaszynaTypSelect = document.getElementById('edit-maszyna-typ');
const editMaszynaModelInput = document.getElementById('edit-maszyna-model');
const editMaszynaSerialInput = document.getElementById('edit-maszyna-serial');
const editMaszynaRokInput = document.getElementById('edit-maszyna-rok');
const editMaszynaMthInput = document.getElementById('edit-maszyna-mth');

const zlecenieDetailsModal = document.getElementById('zlecenie-details-modal');
const detailsModalTitle = document.getElementById('details-modal-title');
const detailsModalContent = document.getElementById('details-modal-content');

const historyModal = document.getElementById('history-modal');
const historyModalTitle = document.getElementById('history-modal-title');
const historyModalList = document.getElementById('history-modal-list');

// --- POMOCNICZE FUNKCJE UI ---
function openTab(evt, tabName) {
    tabContents.forEach(tabContent => tabContent.style.display = 'none');
    tabButtons.forEach(tabButton => tabButton.classList.remove('active'));

    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');

    // Aktualizacja kalendarza przy przełączaniu na Pulpit
    if (tabName === 'pulpit') {
        if (calendar) {
            calendar.render();
            updateDashboardCards(); // <--- WYWOŁANIE FUNKCJI AKTUALIZUJĄCEJ KARTY PULPITU
        }
    } else if (tabName === 'zlecenia') {
        loadOrders(); // Przeładowanie zleceń, np. po zmianach
        loadCompletedOrders();
        updateSummary(miesiacSummaryInput.value);
    } else if (tabName === 'klienci') {
        loadClients();
    } else if (tabName === 'maszyny') {
        loadMachines();
        populateClientSelects();
    } else if (tabName === 'magazyn') {
        loadParts();
    }
}

// Funkcja do zamykania modali
function setupModalCloseHandlers() {
    document.querySelectorAll('.modal .close-button').forEach(button => {
        button.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Formatowanie daty do YYYY-MM-DD
function formatDateToInput(date) {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Funkcja do formatowania liczby na walutę
function formatCurrency(value) {
    return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(value);
}

// --- FUNKCJE OBSŁUGI DANYCH FIREBASE ---
// KLIENCI
async function addClient(name, nip, address, phone) {
    try {
        await addDoc(clientsCol, {
            name,
            nip,
            address,
            phone,
            createdAt: new Date().toISOString()
        });
        alert('Klient dodany pomyślnie!');
        klientForm.reset();
        loadClients();
        populateClientSelects(); // Odśwież selecty
    } catch (e) {
        console.error("Błąd dodawania klienta: ", e);
        alert('Wystąpił błąd podczas dodawania klienta.');
    }
}

async function loadClients() {
    listaKlientowUl.innerHTML = '';
    const q = query(clientsCol, orderBy('name'));
    const querySnapshot = await getDocs(q);
    const clientsData = [];

    querySnapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() });
    });

    clientsData.forEach(client => {
        const clientGroupDiv = document.createElement('div');
        clientGroupDiv.classList.add('client-group');

        const clientHeaderDiv = document.createElement('div');
        clientHeaderDiv.classList.add('client-header');
        clientHeaderDiv.innerHTML = `
            <h4>${client.name}</h4>
            <div>
                <button class="btn-edit" data-id="${client.id}" data-name="${client.name}" data-nip="${client.nip || ''}" data-address="${client.address || ''}" data-phone="${client.phone || ''}">Edytuj</button>
                <button class="btn-remove" data-id="${client.id}">Usuń</button>
                <button class="btn-primary" data-id="${client.id}" data-action="history">Historia zleceń</button>
                <span class="arrow">▶</span>
            </div>
        `;
        clientGroupDiv.appendChild(clientHeaderDiv);

        const machineListUl = document.createElement('ul');
        machineListUl.classList.add('machine-list');
        clientGroupDiv.appendChild(machineListUl);

        // Dodaj słuchacza do nagłówka grupy klienta, aby przełączać widoczność
        clientHeaderDiv.addEventListener('click', (e) => {
            // Upewnij się, że kliknięcie na przyciski nie zamyka/otwiera listy
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            clientHeaderDiv.classList.toggle('open');
            machineListUl.classList.toggle('open');
            if (machineListUl.classList.contains('open') && machineListUl.children.length === 0) {
                loadMachinesForClient(client.id, machineListUl);
            }
        });


        // Obsługa przycisków Edytuj i Usuń dla klienta
        clientHeaderDiv.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation(); // Zapobiegaj zamykaniu/otwieraniu listy maszyn
            const clientId = e.target.dataset.id;
            const clientName = e.target.dataset.name;
            const clientNip = e.target.dataset.nip;
            const clientAddress = e.target.dataset.address;
            const clientPhone = e.target.dataset.phone;
            
            editKlientIdInput.value = clientId;
            editKlientNazwaInput.value = clientName;
            editKlientNipInput.value = clientNip;
            editKlientAdresInput.value = clientAddress;
            editKlientTelefonInput.value = clientPhone;
            editKlientModal.style.display = 'block';
        });

        clientHeaderDiv.querySelector('.btn-remove').addEventListener('click', async (e) => {
            e.stopPropagation(); // Zapobiegaj zamykaniu/otwieraniu listy maszyn
            if (confirm('Czy na pewno chcesz usunąć tego klienta oraz wszystkie jego maszyny i zlecenia?')) {
                await deleteClient(client.id);
            }
        });

        clientHeaderDiv.querySelector('[data-action="history"]').addEventListener('click', async (e) => {
            e.stopPropagation();
            await showClientOrderHistory(client.id, client.name);
        });

        listaKlientowUl.appendChild(clientGroupDiv);
    });
}

async function updateClient(id, name, nip, address, phone) {
    try {
        const clientDoc = doc(db, 'clients', id);
        await updateDoc(clientDoc, { name, nip, address, phone });
        alert('Dane klienta zaktualizowane pomyślnie!');
        editKlientModal.style.display = 'none';
        loadClients();
        populateClientSelects();
        loadOrders(); // Odśwież zlecenia, bo mogły zmienić się nazwy klientów
    } catch (e) {
        console.error("Błąd aktualizacji klienta: ", e);
        alert('Wystąpił błąd podczas aktualizacji klienta.');
    }
}

async function deleteClient(id) {
    try {
        // Usuń maszyny klienta
        const qMachines = query(machinesCol, where('clientId', '==', id));
        const machinesSnapshot = await getDocs(qMachines);
        const deleteMachinePromises = [];
        machinesSnapshot.forEach(async (machineDoc) => {
            deleteMachinePromises.push(deleteDoc(doc(db, 'machines', machineDoc.id)));
        });
        await Promise.all(deleteMachinePromises);

        // Usuń zlecenia klienta
        const qOrders = query(ordersCol, where('clientId', '==', id));
        const ordersSnapshot = await getDocs(qOrders);
        const deleteOrderPromises = [];
        ordersSnapshot.forEach(async (orderDoc) => {
            deleteOrderPromises.push(deleteDoc(doc(db, 'orders', orderDoc.id)));
        });
        await Promise.all(deleteOrderPromises);

        // Usuń samego klienta
        await deleteDoc(doc(db, 'clients', id));

        alert('Klient, jego maszyny i zlecenia usunięte pomyślnie!');
        loadClients();
        populateClientSelects();
        loadMachines(); // Przeładuj maszyny, bo mogły zostać usunięte
        loadOrders();   // Przeładuj zlecenia, bo mogły zostać usunięte
    } catch (e) {
        console.error("Błąd usuwania klienta: ", e);
        alert('Wystąpił błąd podczas usuwania klienta.');
    }
}

// MASZYNY
async function addMachine(clientId, type, model, serial, year, mth) {
    try {
        await addDoc(machinesCol, {
            clientId,
            type,
            model,
            serial: serial || null,
            year: year || null,
            mth: mth || null,
            createdAt: new Date().toISOString()
        });
        alert('Maszyna dodana pomyślnie!');
        maszynaForm.reset();
        loadMachines();
    } catch (e) {
        console.error("Błąd dodawania maszyny: ", e);
        alert('Wystąpił błąd podczas dodawania maszyny.');
    }
}

async function loadMachines() {
    listaMaszynDiv.innerHTML = ''; // Czyścimy listę globalnie
    const q = query(machinesCol, orderBy('clientId'), orderBy('type'), orderBy('model'));
    const querySnapshot = await getDocs(q);

    // Grupowanie maszyn po kliencie
    const machinesByClient = {};
    for (const machineDoc of querySnapshot.docs) {
        const machine = { id: machineDoc.id, ...machineDoc.data() };
        if (!machinesByClient[machine.clientId]) {
            machinesByClient[machine.clientId] = [];
        }
        machinesByClient[machine.clientId].push(machine);
    }

    // Załaduj klientów, aby uzyskać nazwy
    const clientsSnapshot = await getDocs(clientsCol);
    const clientsMap = new Map();
    clientsSnapshot.forEach(doc => {
        clientsMap.set(doc.id, doc.data().name);
    });

    listaKlientowUl.innerHTML = ''; // Czyścimy główną listę klientów, żeby zbudować ją od nowa z maszynami

    for (const clientEntry of clientsData) { // clientsData powinna być załadowana przez loadClients
        const client = clientEntry;
        const clientGroupDiv = document.createElement('div');
        clientGroupDiv.classList.add('client-group');

        const clientHeaderDiv = document.createElement('div');
        clientHeaderDiv.classList.add('client-header');
        clientHeaderDiv.innerHTML = `
            <h4>${client.name}</h4>
            <div>
                <button class="btn-edit" data-id="${client.id}" data-name="${client.name}" data-nip="${client.nip || ''}" data-address="${client.address || ''}" data-phone="${client.phone || ''}">Edytuj</button>
                <button class="btn-remove" data-id="${client.id}">Usuń</button>
                <button class="btn-primary" data-id="${client.id}" data-action="history">Historia zleceń</button>
                <span class="arrow">▶</span>
            </div>
        `;
        clientGroupDiv.appendChild(clientHeaderDiv);

        const machineListUl = document.createElement('ul');
        machineListUl.classList.add('machine-list');
        clientGroupDiv.appendChild(machineListUl);

        // ... reszta kodu dla obsługi kliknięć i przycisków klienta (jak w loadClients)

        if (machinesByClient[client.id]) {
            machinesByClient[client.id].forEach(machine => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${machine.type} - ${machine.model} (${machine.serial || 'Brak s/n'})</span>
                    <div>
                        <button class="btn-edit" data-id="${machine.id}" data-client-id="${client.id}">Edytuj</button>
                        <button class="btn-remove" data-id="${machine.id}">Usuń</button>
                    </div>
                `;
                machineListUl.appendChild(li);
            });
        }
        listaMaszynDiv.appendChild(clientGroupDiv); // Dodaj do sekcji maszyn
    }

    // Jeśli chcesz osobną listę maszyn niezależnie od listy klientów, musisz tu zbudować osobną strukturę
    // Obecnie loadMachines() i loadClients() są ze sobą sprzężone.
}

async function loadMachinesForClient(clientId, targetUl) {
    targetUl.innerHTML = ''; // Wyczyść listę przed załadowaniem
    const q = query(machinesCol, where('clientId', '==', clientId), orderBy('type'), orderBy('model'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const li = document.createElement('li');
        li.textContent = 'Brak maszyn dla tego klienta.';
        li.style.justifyContent = 'center';
        li.style.fontStyle = 'italic';
        targetUl.appendChild(li);
        return;
    }

    querySnapshot.forEach(doc => {
        const machine = { id: doc.id, ...doc.data() };
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${machine.type} - ${machine.model} (${machine.serial || 'Brak s/n'}) - MTH: ${machine.mth || 'N/A'}</span>
            <div>
                <button class="btn-edit" data-id="${machine.id}">Edytuj</button>
                <button class="btn-remove" data-id="${machine.id}">Usuń</button>
            </div>
        `;
        targetUl.appendChild(li);
        
        // Obsługa edycji maszyny
        li.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            const machineId = e.target.dataset.id;
            editMachine(machineId);
        });

        // Obsługa usuwania maszyny
        li.querySelector('.btn-remove').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm('Czy na pewno chcesz usunąć tę maszynę? Zlecenia powiązane z tą maszyną również zostaną usunięte.')) {
                await deleteMachine(machine.id);
            }
        });
    });
}


async function editMachine(machineId) {
    const machineDoc = await getDoc(doc(db, 'machines', machineId));
    if (machineDoc.exists()) {
        const machineData = machineDoc.data();
        editMaszynaIdInput.value = machineId;
        editMaszynaTypSelect.value = machineData.type;
        editMaszynaModelInput.value = machineData.model;
        editMaszynaSerialInput.value = machineData.serial || '';
        editMaszynaRokInput.value = machineData.year || '';
        editMaszynaMthInput.value = machineData.mth || '';
        editMaszynaModal.style.display = 'block';
    } else {
        alert('Maszyna nie znaleziona.');
    }
}

async function updateMachine(id, type, model, serial, year, mth) {
    try {
        const machineDoc = doc(db, 'machines', id);
        await updateDoc(machineDoc, { type, model, serial, year, mth });
        alert('Dane maszyny zaktualizowane pomyślnie!');
        editMaszynaModal.style.display = 'none';
        loadClients(); // Przeładuj listę klientów i maszyn, aby odświeżyć widok
        loadMachines();
        loadOrders(); // Odśwież zlecenia, bo mogły zmienić się dane maszyny
    } catch (e) {
        console.error("Błąd aktualizacji maszyny: ", e);
        alert('Wystąpił błąd podczas aktualizacji maszyny.');
    }
}

async function deleteMachine(id) {
    try {
        // Usuń zlecenia powiązane z tą maszyną
        const qOrders = query(ordersCol, where('machineId', '==', id));
        const ordersSnapshot = await getDocs(qOrders);
        const deleteOrderPromises = [];
        ordersSnapshot.forEach(async (orderDoc) => {
            deleteOrderPromises.push(deleteDoc(doc(db, 'orders', orderDoc.id)));
        });
        await Promise.all(deleteOrderPromises);

        // Usuń maszynę
        await deleteDoc(doc(db, 'machines', id));

        alert('Maszyna i powiązane zlecenia usunięte pomyślnie!');
        loadClients(); // Przeładuj listę klientów i maszyn
        loadMachines();
        loadOrders();   // Przeładuj zlecenia
    } catch (e) {
        console.error("Błąd usuwania maszyny: ", e);
        alert('Wystąpił błąd podczas usuwania maszyny.');
    }
}
// ZLECENIA
async function addOrder(clientId, clientName, machineId, machineInfo, nrZlecenia, opisUsterki, motogodziny) {
    try {
        await addDoc(ordersCol, {
            clientId: clientId || null,
            clientName: clientName || 'Szybkie zlecenie', // Nazwa klienta dla szybkiego zlecenia
            machineId: machineId || null,
            machineInfo: machineInfo || null, // Np. "Typ - Model (S/N)"
            nrZlecenia,
            opisUsterki: opisUsterki || null,
            motogodziny: motogodziny || null,
            status: 'Aktywne',
            createdAt: new Date().toISOString()
        });
        alert('Zlecenie dodane pomyślnie!');
        zlecenieForm.reset();
        zlecenieKlientSelect.value = '';
        zlecenieMaszynaSelect.innerHTML = '<option value="">-- Najpierw wybierz klienta --</option>';
        zlecenieMaszynaSelect.disabled = true;
        loadOrders();
        updateDashboardCards(); // Zaktualizuj karty po dodaniu zlecenia
    } catch (e) {
        console.error("Błąd dodawania zlecenia: ", e);
        alert('Wystąpił błąd podczas dodawania zlecenia.');
    }
}

async function loadOrders() {
    aktywneZleceniaDiv.innerHTML = '';
    const q = query(ordersCol, where('status', '==', 'Aktywne'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        aktywneZleceniaDiv.innerHTML = '<p style="text-align: center; font-style: italic; color: var(--primary-color);">Brak aktywnych zleceń.</p>';
        return;
    }

    const ordersData = [];
    querySnapshot.forEach(doc => {
        ordersData.push({ id: doc.id, ...doc.data() });
    });

    // Wczytanie wszystkich klientów i maszyn do map, aby uniknąć wielu zapytań w pętli
    const clientsSnapshot = await getDocs(clientsCol);
    const clientsMap = new Map();
    clientsSnapshot.forEach(doc => clientsMap.set(doc.id, doc.data()));

    const machinesSnapshot = await getDocs(machinesCol);
    const machinesMap = new Map();
    machinesSnapshot.forEach(doc => machinesMap.set(doc.id, doc.data()));

    ordersData.forEach(order => {
        const li = document.createElement('li');
        let clientInfo = order.clientName || 'Brak klienta';
        let machineInfo = order.machineInfo || '';

        if (order.clientId && clientsMap.has(order.clientId)) {
            clientInfo = clientsMap.get(order.clientId).name;
            if (order.machineId && machinesMap.has(order.machineId)) {
                const machine = machinesMap.get(order.machineId);
                machineInfo = `${machine.type} - ${machine.model} (s/n: ${machine.serial || 'N/A'})`;
            }
        }

        li.innerHTML = `
            <span>
                <strong>Nr zlecenia:</strong> ${order.nrZlecenia} <br>
                <strong>Klient:</strong> ${clientInfo} <br>
                ${machineInfo ? `<strong>Maszyna:</strong> ${machineInfo}<br>` : ''}
                <strong>Opis:</strong> ${order.opisUsterki || 'Brak opisu'} <br>
                ${order.motogodziny ? `<strong>MTH:</strong> ${order.motogodziny}<br>` : ''}
                <small>Dodano: ${new Date(order.createdAt).toLocaleDateString('pl-PL')}</small>
            </span>
            <div>
                <button class="complete-btn" data-id="${order.id}" data-nazwa="${order.nrZlecenia}">Zakończ</button>
                <button class="assign-btn" data-id="${order.id}" data-opis="${order.nrZlecenia} - ${order.opisUsterki || ''}">Przypisz</button>
                <button class="btn-edit" data-id="${order.id}">Edytuj</button>
                <button class="btn-remove" data-id="${order.id}">Usuń</button>
                <button class="btn-primary" data-id="${order.id}" data-action="details">Szczegóły</button>
            </div>
        `;
        aktywneZleceniaDiv.appendChild(li);

        li.querySelector('.complete-btn').addEventListener('click', (e) => {
            currentZlecenieId = e.target.dataset.id;
            modalZlecenieNazwaSpan.textContent = e.target.dataset.nazwa;
            completeZlecenieModal.style.display = 'block';
            loadPartsForCompletion(); // Załaduj części do wyboru
        });

        li.querySelector('.assign-btn').addEventListener('click', async (e) => {
            currentZlecenieId = e.target.dataset.id;
            assignZlecenieOpisSpan.textContent = e.target.dataset.opis;
            await populateAssignClientSelect(); // Wypełnij select klientów
            assignZlecenieModal.style.display = 'block';
            assignNowyKlientInput.value = ''; // Wyczyść pole nowego klienta
            assignMachineSection.style.display = 'none'; // Ukryj sekcję maszyn
        });

        li.querySelector('.btn-remove').addEventListener('click', async (e) => {
            if (confirm('Czy na pewno chcesz usunąć to zlecenie?')) {
                await deleteDoc(doc(db, 'orders', e.target.dataset.id));
                alert('Zlecenie usunięte!');
                loadOrders();
                updateDashboardCards(); // Zaktualizuj karty po usunięciu zlecenia
            }
        });

        li.querySelector('.btn-edit').addEventListener('click', async (e) => {
            alert('Funkcja edycji zlecenia nie jest jeszcze zaimplementowana.');
            // Implementacja edycji zlecenia
            // currentZlecenieId = e.target.dataset.id;
            // Tutaj logika do załadowania danych zlecenia do formularza edycji
            // np. otworzyć nowy modal edycji zlecenia
        });

        li.querySelector('.btn-primary[data-action="details"]').addEventListener('click', async (e) => {
            const orderId = e.target.dataset.id;
            await showZlecenieDetails(orderId);
        });
    });
}

async function showZlecenieDetails(orderId) {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    if (!orderDoc.exists()) {
        alert('Zlecenie nie znalezione.');
        return;
    }
    const order = { id: orderDoc.id, ...orderDoc.data() };

    let clientInfo = order.clientName || 'Brak klienta';
    let machineInfo = order.machineInfo || 'Brak maszyny';

    if (order.clientId) {
        const clientDoc = await getDoc(doc(db, 'clients', order.clientId));
        if (clientDoc.exists()) {
            clientInfo = clientDoc.data().name;
        }
    }

    if (order.machineId) {
        const machineDoc = await getDoc(doc(db, 'machines', order.machineId));
        if (machineDoc.exists()) {
            const machine = machineDoc.data();
            machineInfo = `${machine.type} - ${machine.model} (s/n: ${machine.serial || 'N/A'})`;
        }
    }

    let partsHtml = '<ul>';
    if (order.usedParts && order.usedParts.length > 0) {
        order.usedParts.forEach(part => {
            partsHtml += `<li>${part.name} (Index: ${part.index}), Ilość: ${part.quantity}</li>`;
        });
    } else {
        partsHtml += '<li>Brak użytych części</li>';
    }
    partsHtml += '</ul>';

    detailsModalContent.innerHTML = `
        <p><strong>Nr Zlecenia:</strong> ${order.nrZlecenia}</p>
        <p><strong>Klient:</strong> ${clientInfo}</p>
        <p><strong>Maszyna:</strong> ${machineInfo}</p>
        <p><strong>Opis Usterki:</strong> ${order.opisUsterki || 'Brak'}</p>
        <p><strong>Motogodziny:</strong> ${order.motogodziny || 'Brak'}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Wyfakturowane Godziny:</strong> ${order.invoicedHours || 'Brak'}</p>
        <p><strong>Typ Zlecenia:</strong> ${order.orderType || 'Brak'}</p>
        <p><strong>Wartość (netto):</strong> ${order.nettoValue !== undefined ? formatCurrency(order.nettoValue) : 'Brak'}</p>
        <p><strong>Wartość (brutto):</strong> ${order.bruttoValue !== undefined ? formatCurrency(order.bruttoValue) : 'Brak'}</p>
        <p><strong>Data zakończenia:</strong> ${order.completionDate ? new Date(order.completionDate).toLocaleDateString('pl-PL') : 'Brak'}</p>
        <h4>Użyte części:</h4>
        ${partsHtml}
    `;
    detailsModalTitle.textContent = `Szczegóły zlecenia: ${order.nrZlecenia}`;
    zlecenieDetailsModal.style.display = 'block';
}


async function completeOrder(orderId, invoicedHours, orderType, partsToDeduct) {
    try {
        const orderDocRef = doc(db, 'orders', orderId);
        let nettoValue = 0;
        let stawka = 0;
        const VAT_RATE = 0.23; // 23% VAT

        switch (orderType) {
            case 'S': stawka = 45; break; // Wyjazdowe
            case 'W': stawka = 35; break; // Warsztat
            case 'G': stawka = 35; break; // Gwarancja
            case 'Z': stawka = 30; break; // Zbrojenie
            case 'P': stawka = 0; break;  // Poprawka
            default: stawka = 0;
        }

        nettoValue = parseFloat(invoicedHours) * stawka;
        const bruttoValue = nettoValue * (1 + VAT_RATE);

        // Zaktualizuj stan magazynu
        const usedPartsDetails = [];
        for (const part of partsToDeduct) {
            const partDocRef = doc(db, 'products', part.id);
            const partDoc = await getDoc(partDocRef);
            if (partDoc.exists()) {
                const currentQuantity = partDoc.data().quantity || 0;
                const newQuantity = currentQuantity - part.quantity;
                await updateDoc(partDocRef, { quantity: newQuantity });
                usedPartsDetails.push({
                    id: part.id,
                    index: partDoc.data().index,
                    name: partDoc.data().name,
                    quantity: part.quantity
                });
            } else {
                console.warn(`Część o ID ${part.id} nie znaleziona w magazynie.`);
            }
        }
        
        await updateDoc(orderDocRef, {
            status: 'Ukończone',
            invoicedHours: parseFloat(invoicedHours),
            orderType: orderType,
            nettoValue: nettoValue,
            bruttoValue: bruttoValue,
            completionDate: new Date().toISOString().split('T')[0], // Data zakończenia w formacie YYYY-MM-DD
            usedParts: usedPartsDetails // Zapisz listę użytych części
        });
        alert('Zlecenie zakończone pomyślnie i stan magazynu zaktualizowany!');
        completeZlecenieModal.style.display = 'none';
        activePartsToRemove = []; // Wyczyść listę
        partsToRemoveListUl.innerHTML = '';
        loadOrders();
        loadCompletedOrders();
        updateSummary(miesiacSummaryInput.value); // Zaktualizuj podsumowanie
        loadParts(); // Odśwież magazyn po zdjęciu części
        updateDashboardCards(); // Zaktualizuj karty po zakończeniu zlecenia
    } catch (e) {
        console.error("Błąd kończenia zlecenia: ", e);
        alert('Wystąpił błąd podczas kończenia zlecenia.');
    }
}
// MAGAZYN
async function addPart(index, name, quantity, client) {
    try {
        await addDoc(partsCol, {
            index,
            name,
            quantity: parseFloat(quantity),
            client: client || null,
            createdAt: new Date().toISOString()
        });
        alert('Produkt dodany pomyślnie!');
        magazynForm.reset();
        loadParts();
        updateDashboardCards(); // Zaktualizuj karty po dodaniu produktu
    } catch (e) {
        console.error("Błąd dodawania produktu: ", e);
        alert('Wystąpił błąd podczas dodawania produktu.');
    }
}

async function bulkAddParts(client, itemsString) {
    try {
        const lines = itemsString.split('\n').filter(line => line.trim() !== '');
        const addPromises = lines.map(async (line) => {
            const [index, name, quantity] = line.split(';').map(s => s.trim());
            if (index && name && quantity && !isNaN(parseFloat(quantity))) {
                await addDoc(partsCol, {
                    index,
                    name,
                    quantity: parseFloat(quantity),
                    client: client || null,
                    createdAt: new Date().toISOString()
                });
            } else {
                console.warn(`Pominięto linię (niepoprawny format): ${line}`);
            }
        });
        await Promise.all(addPromises);
        alert('Produkty dodane masowo pomyślnie!');
        bulkAddForm.reset();
        loadParts();
        updateDashboardCards();
    } catch (e) {
        console.error("Błąd masowego dodawania produktów: ", e);
        alert('Wystąpił błąd podczas masowego dodawania produktów.');
    }
}

async function loadParts() {
    magazynListaTbody.innerHTML = '';
    modalMagazynListaDiv.innerHTML = ''; // Czyścimy listę w modalu
    const q = query(partsCol, orderBy('name'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        magazynListaTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; font-style: italic; color: var(--primary-color);">Brak produktów w magazynie.</td></tr>';
        modalMagazynListaDiv.innerHTML = '<p style="text-align: center; font-style: italic;">Brak produktów w magazynie.</p>';
        return;
    }

    querySnapshot.forEach(doc => {
        const part = { id: doc.id, ...doc.data() };
        const isOil = part.index && (part.index.startsWith('HYGARD') || part.index.startsWith('PLUS50') || part.index.startsWith('COOLGARD') || part.index.startsWith('EXTGARD'));

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${part.index}</td>
            <td>${part.name}</td>
            <td>${part.quantity.toFixed(2)}</td>
            <td>${isOil ? (part.quantity * getOilConversionFactor(part.index)).toFixed(2) : 'N/A'}</td>
            <td>${part.client || 'Brak'}</td>
            <td>
                <button class="btn-edit" data-id="${part.id}" data-name="${part.name}" data-index="${part.index}">Zmień</button>
                <button class="btn-remove" data-id="${part.id}">Usuń</button>
            </td>
        `;
        magazynListaTbody.appendChild(tr);

        // Dodaj do modalu zakończenia zlecenia
        const modalItemDiv = document.createElement('div');
        modalItemDiv.classList.add('modal-stock-item');
        modalItemDiv.dataset.partId = part.id;
        modalItemDiv.dataset.partIndex = part.index;
        modalItemDiv.dataset.partName = part.name;
        modalItemDiv.dataset.partQuantity = part.quantity;
        modalItemDiv.innerHTML = `
            <span>${part.index} - ${part.name}</span>
            <span class="item-qty">Dostępne: ${part.quantity.toFixed(2)}</span>
        `;
        modalMagazynListaDiv.appendChild(modalItemDiv);

        tr.querySelector('.btn-edit').addEventListener('click', (e) => {
            currentMagazynItemId = e.target.dataset.id;
            stockModalTitle.textContent = `Zmień stan: ${e.target.dataset.name}`;
            stockModalNameSpan.textContent = `${e.target.dataset.index} - ${e.target.dataset.name}`;
            stockModalCurrentQtySpan.textContent = part.quantity.toFixed(2);
            stockChangeQtyInput.value = part.quantity; // Domyślnie obecna ilość
            stockChangeModal.style.display = 'block';
        });

        tr.querySelector('.btn-remove').addEventListener('click', async (e) => {
            if (confirm('Czy na pewno chcesz usunąć ten produkt z magazynu?')) {
                await deleteDoc(doc(db, 'products', e.target.dataset.id));
                alert('Produkt usunięty!');
                loadParts();
                updateDashboardCards();
            }
        });
    });
}

async function updatePartQuantity(id, newQuantity) {
    try {
        const partDocRef = doc(db, 'products', id);
        await updateDoc(partDocRef, { quantity: parseFloat(newQuantity) });
        alert('Ilość produktu zaktualizowana pomyślnie!');
        stockChangeModal.style.display = 'none';
        loadParts();
        updateDashboardCards(); // Zaktualizuj karty po zmianie ilości
    } catch (e) {
        console.error("Błąd aktualizacji ilości produktu: ", e);
        alert('Wystąpił błąd podczas aktualizacji ilości produktu.');
    }
}

// Kalendarz (Ewidencja czasu)
async function addOrUpdateEvent(date, hoursWorked, hoursInvoiced, overtime, driveTime, note, eventId = null) {
    try {
        const eventData = {
            start: date, // Data w formacie YYYY-MM-DD
            title: `P: ${hoursWorked}h, F: ${hoursInvoiced}h, N: ${overtime}h, J: ${driveTime}h`,
            extendedProps: {
                hoursWorked: parseFloat(hoursWorked),
                hoursInvoiced: parseFloat(hoursInvoiced),
                overtime: parseFloat(overtime),
                driveTime: parseFloat(driveTime),
                note: note || ''
            }
        };

        if (eventId) {
            await updateDoc(doc(db, 'events', eventId), eventData);
        } else {
            await addDoc(eventsCol, eventData);
        }
        alert('Ewidencja czasu zapisana pomyślnie!');
        kalendarzModal.style.display = 'none';
        calendar.refetchEvents(); // Odśwież kalendarz
        updateDashboardCards(); // Zaktualizuj karty po zmianie wydarzenia
    } catch (e) {
        console.error("Błąd zapisu ewidencji czasu: ", e);
        alert('Wystąpił błąd podczas zapisu ewidencji czasu.');
    }
}

async function loadEvents() {
    const querySnapshot = await getDocs(eventsCol);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function setupCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pl',
        firstDay: 1, // Poniedziałek
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                const events = await loadEvents();
                successCallback(events);
            } catch (error) {
                console.error("Błąd ładowania wydarzeń kalendarza:", error);
                failureCallback(error);
            }
        },
        dateClick: (info) => {
            // Otwórz modal do dodawania/edycji czasu
            kalendarzModalTitle.textContent = `Ewidencja Czasu dla: ${info.dateStr}`;
            kalendarzDataInput.value = info.dateStr;
            kalendarzForm.dataset.eventId = ''; // Resetuj ID wydarzenia
            godzinyPracyInput.value = 0;
            godzinyWyfakturowaneInput.value = 0;
            nadgodzinyInput.value = 0;
            godzinyJazdyInput.value = 0;
            kalendarzNotatkaInput.value = '';
            kalendarzModal.style.display = 'block';
        },
        eventClick: async (info) => {
            const eventId = info.event.id;
            const eventDoc = await getDoc(doc(db, 'events', eventId));
            if (eventDoc.exists()) {
                const eventData = eventDoc.data();
                kalendarzModalTitle.textContent = `Edytuj Ewidencję Czasu dla: ${eventData.start}`;
                kalendarzDataInput.value = eventData.start;
                kalendarzForm.dataset.eventId = eventId; // Ustaw ID wydarzenia dla edycji
                godzinyPracyInput.value = eventData.extendedProps.hoursWorked || 0;
                godzinyWyfakturowaneInput.value = eventData.extendedProps.hoursInvoiced || 0;
                nadgodzinyInput.value = eventData.extendedProps.overtime || 0;
                godzinyJazdyInput.value = eventData.extendedProps.driveTime || 0;
                kalendarzNotatkaInput.value = eventData.extendedProps.note || '';
                kalendarzModal.style.display = 'block';
            }
        }
    });
    calendar.render();
}

// --- FUNKCJE DLA PULPITU (DASHBOARD) ---
async function updateDashboardCards() {
    const activeOrdersCountEl = document.getElementById('active-orders-count');
    const monthlyNetRevenueEl = document.getElementById('monthly-net-revenue');
    const lowStockCountEl = document.getElementById('low-stock-count');
    const upcomingEventsListEl = document.getElementById('upcoming-events-list');

    if (!activeOrdersCountEl || !monthlyNetRevenueEl || !lowStockCountEl || !upcomingEventsListEl) {
        console.warn("Elementy pulpitu nie zostały znalezione. Sprawdź index.html i upewnij się, że ID są poprawne.");
        return;
    }

    // 1. Aktywne Zlecenia
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('status', '==', 'Aktywne'));
        const querySnapshot = await getDocs(q);
        activeOrdersCountEl.textContent = querySnapshot.size;
    } catch (error) {
        console.error("Błąd pobierania aktywnych zleceń:", error);
        activeOrdersCountEl.textContent = "Błąd";
    }

    // 2. Przychód Miesięczny (Netto) - na podstawie ukończonych zleceń z bieżącego miesiąca
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // Koniec miesiąca
        const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
        const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

        const completedOrdersRef = collection(db, 'orders');
        const q = query(
            completedOrdersRef,
            where('status', '==', 'Ukończone'),
            where('completionDate', '>=', startOfMonthStr),
            where('completionDate', '<=', endOfMonthStr)
        );
        const querySnapshot = await getDocs(q);
        let totalRevenue = 0;
        querySnapshot.forEach(doc => {
            const order = doc.data();
            const price = parseFloat(order.nettoValue || order.totalPrice || 0);
            if (!isNaN(price)) {
                totalRevenue += price;
            }
        });
        monthlyNetRevenueEl.textContent = `${totalRevenue.toFixed(2)} zł`;
    } catch (error) {
        console.error("Błąd pobierania przychodu miesięcznego:", error);
        monthlyNetRevenueEl.textContent = "Błąd";
    }

    // 3. Produkty do Zamówienia (niski stan magazynowy)
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('quantity', '<=', 5)); // Próg 5, możesz zmienić
        const querySnapshot = await getDocs(q);
        lowStockCountEl.textContent = querySnapshot.size;
    } catch (error) {
        console.error("Błąd pobierania produktów z niskim stanem:", error);
        lowStockCountEl.textContent = "Błąd";
    }

    // 4. Najbliższe Zlecenia/Spotkania (wydarzenia z kalendarza)
    try {
        const eventsRef = collection(db, 'events');
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const allEventsSnapshot = await getDocs(query(eventsRef, orderBy('start'))); // Pobierz wszystkie posortowane
        const upcomingEvents = [];
        allEventsSnapshot.forEach(doc => {
            const event = doc.data();
            const eventStartDate = new Date(event.start);
            // Sprawdzamy, czy wydarzenie jest w przyszłości i w ciągu najbliższych 7 dni
            if (eventStartDate >= now && eventStartDate <= sevenDaysFromNow) {
                upcomingEvents.push(event);
            }
        });

        upcomingEventsListEl.innerHTML = ''; // Wyczyść listę
        if (upcomingEvents.length > 0) {
            upcomingEvents.slice(0, 5).forEach(event => { // Pokaż max 5
                const li = document.createElement('li');
                const date = new Date(event.start).toLocaleDateString('pl-PL', { year: 'numeric', month: 'short', day: 'numeric' });
                li.textContent = `${date}: ${event.title}`;
                upcomingEventsListEl.appendChild(li);
            });
        } else {
            upcomingEventsListEl.innerHTML = '<li>Brak nadchodzących</li>';
        }
    } catch (error) {
        console.error("Błąd pobierania nadchodzących wydarzeń:", error);
        upcomingEventsListEl.innerHTML = '<li>Błąd ładowania</li>';
    }
}

// --- INITIALIZACJA ---
document.addEventListener('DOMContentLoaded', () => {
    setupModalCloseHandlers();
    tabButtons[0].click(); // Aktywuj Pulpit domyślnie
    setupCalendar();
    loadClients();
    loadMachines();
    populateClientSelects();
    loadOrders();
    loadParts();
    setupEventListeners();
    updateDashboardCards(); // <--- WYWOŁANIE FUNKCJI PRZY STARTOWANIU APLIKACJI
    
    // Ustawienie domyślnego miesiąca dla podsumowania na bieżący
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    miesiacSummaryInput.value = currentMonth;
    updateSummary(currentMonth);

    // Zwiń sekcję zakończonych zleceń domyślnie
    toggleUkonczoneBtn.classList.remove('open');
    collapsibleContent.classList.remove('open');
});

// Reszta kodu... (tutaj kończy się plik main.js w naszej instrukcji)