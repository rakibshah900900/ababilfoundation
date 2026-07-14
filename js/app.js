// ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর করার ফাংশন
function translateToBengaliNumber(num) {
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(digit => bengaliDigits[digit] || digit).join('');
}

// 🗄️ SUPABASE ডাটাবেজ কনফিগারেশন এরিয়া
// ==================================================
const SUPABASE_URL = "https://cigpnrygurwsdfavihse.supabase.co";
const SUPABASE_KEY = "sb_publishable_Yl2IaoY4vQhLcEjdkhFYRA_dKzA-gIT";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// বাংলা বানানকে হোয়াটসঅ্যাপের উপযোগী ইংরেজি বানানে রূপান্তর করার ফাংশন
function transliterateBengaliToEnglish(text) {
    const charMap = {
        'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
        'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
        'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
        'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
        'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
        'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
        'য': 'z', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ष': 'sh', 'স': 's', 'হ': 'h',
        'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
        'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
        'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n'
    };
    return text.split('').map(char => charMap[char] || char).join('');
}

// ==================================================
// 📨 EMAILJS কনফিগারেশন (পাসওয়ার্ড রিসেটের জন্য)
// ==================================================
const EMAILJS_PUBLIC_KEY = "RyTeYPCeE11eHB-AL";
const EMAILJS_SERVICE_ID = "service22";
const EMAILJS_TEMPLATE_ID = "template_bf8ofq6";

if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// ==================================================
// ⚙️ গ্লোবাল ভেরিয়েবলসমূহ
// ==================================================
const banglaMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const currentCalendarMonthIndex = new Date().getMonth();

let globalReceiptCounter = 1001;
let globalExpenseCounter = 1001;
let pageHistory = ['homeView'];
let historyPointer = 0;
let currentSectionId = 'homeView';

const pageTitles = {
    'homeView': 'হোম পেজ',
    'regFormSection': 'নতুন সদস্য নিবন্ধন ফরম',
    'memberListSection': 'সদস্য তালিকা',
    'incomeSection': 'আয়ের বিবরণী',
    'expenseSection': 'ব্যয়ের বিবরণী',

    'bloodBankSection': 'আবাবিল ব্লাড ব্যাংক',
    'receiptSection': 'ডিজিটাল রশিদ ভিউয়ার'
};

/// ডাটাবেজ ব্যাকআপ ডাটা
let membersData = [];

let globalTickerText = ""; // লাইভ নোটিশের টেক্সট ধরে রাখার জন্য
let donationEntries = [];
let expenseEntries = [];
let autoIdCounter = 101;
let donationReceiptsStatus = {};

let tempPaidMonths = [];
let initialPaidMonths = [];
let selectedMemberId = null;
let memberToDelete = null;

let pendingRegistrationData = null;
let incomeChartInstance = null;
let expenseChartInstance = null;

// ==================================================
// 🛠️ নেভিগেশন ও ব্রাউজার ব্যাক বাটন হ্যান্ডলার 
// ==================================================
window.addEventListener('popstate', function (event) {
    if (event.state && event.state.sectionId) {
        historyPointer = event.state.pointer;
        showSection(event.state.sectionId, true);
    } else {
        const currentHash = window.location.hash.replace('#', '');
        if (currentHash && document.getElementById(currentHash)) {
            showSection(currentHash, true);
        } else {
            historyPointer = 0;
            showSection('homeView', true);
        }
    }
});

// কাস্টম কনফার্মেশন মোডাল উইন্ডো হেল্পার
function showConfirmModal(message, onConfirm) {
    document.getElementById('deleteModalMessage').innerText = message;
    document.getElementById('btnDeleteYes').onclick = function () {
        onConfirm();
        closeDeleteModal();
    };
    document.getElementById('deleteConfirmModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

// ট্রাঙ্কেট করার ফাংশন
function truncateText(text, maxLength, title) {
    if (!text) return '---';
    if (text.length <= maxLength) return text;
    let truncated = text.substring(0, maxLength);
    let safeText = encodeURIComponent(text);
    let safeTitle = encodeURIComponent(title);
    return `${truncated}<br><span style="color:var(--primary); cursor:pointer; font-size:11px; font-weight:bold; text-decoration:underline; display:inline-block; margin-top:2px;" onclick="showFullTextModal('${safeText}', '${safeTitle}')">See more...</span>`;
}

function showFullTextModal(encodedText, encodedTitle) {
    const text = decodeURIComponent(encodedText);
    const title = decodeURIComponent(encodedTitle);
    showCustomPopup("ℹ️", title + ": " + text, true);
}

// SUPABASE ডাটা লোডার
async function loadAllDataFromSupabase() {
    try {
        const { data: dbMembers, error: mError } = await supabaseClient
            .from('members')
            .select('*');
        if (mError) throw mError;

        // ডাটাবেজ খালি থাকলে যেন খালি মেম্বার লিস্ট লোড হয়
        membersData = dbMembers || [];

        const { data: dbDonations, error: dError } = await supabaseClient
            .from('donations')
            .select('*');
        if (dError) throw dError;
        if (dbDonations) {
            donationEntries = dbDonations;

            // 🔄 ব্রাউজারের লোকাল স্টোরেজ থেকে পূর্বে সেভ করা স্ট্যাটাস লোড করা হচ্ছে
            let savedStatuses = {};
            try {
                const localData = localStorage.getItem('ababil_donation_receipt_status');
                if (localData) {
                    savedStatuses = JSON.parse(localData);
                }
            } catch (e) {
                console.error("লোকাল স্টোরেজ থেকে তথ্য লোড করতে সমস্যা হয়েছে:", e);
            }

            donationEntries.forEach(entry => {
                // যদি লোকাল স্টোরেজে এই রশিদের কোনো স্ট্যাটাস (যেমন: false বা 'রশিদ পাঠান') সেভ করা থাকে, তবে সেটাই নেওয়া হবে।
                // আর যদি সেভ করা না থাকে (যেমন: অনেক পুরাতন এন্ট্রি), তবে সেটিকে ডিফল্টভাবে true (রশিদ পাঠানো হয়েছে) ধরা হবে।
                if (savedStatuses[entry.receiptNo] !== undefined) {
                    donationReceiptsStatus[entry.receiptNo] = savedStatuses[entry.receiptNo];
                } else {
                    donationReceiptsStatus[entry.receiptNo] = true;
                }
            });

            // লোকাল স্টোরেজ আপডেট করে রাখা হলো
            localStorage.setItem('ababil_donation_receipt_status', JSON.stringify(donationReceiptsStatus));
        }

        try {
            const { data: dbExpenses, error: expErr } = await supabaseClient
                .from('expenses')
                .select('*');
            if (!expErr && dbExpenses) {
                expenseEntries = dbExpenses;
            }
        } catch (err) {
            console.warn("ব্যয়ের ডাটা লোড ব্যর্থ:", err.message);
        }

        if (membersData.length > 0) {
            let maxId = 101;
            membersData.forEach(m => {
                // AF- বা BD- উভয় আইডির ভেতর থেকে কেবল সংখ্যাটুকু নিষ্কাশন করা হচ্ছে
                let idNum = parseInt(m.id.replace(/[^0-9]/g, ''));
                if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
            });
            autoIdCounter = maxId + 1;
        }

        let maxReceiptNum = 1000;
        donationEntries.forEach(e => {
            let recNum = parseInt(e.receiptNo.replace('AF-REC-', ''));
            if (!isNaN(recNum) && recNum > maxReceiptNum) maxReceiptNum = recNum;
        });
        membersData.forEach(m => {
            if (m.latestReceiptNo) {
                let recNum = parseInt(m.latestReceiptNo.replace('AF-REC-', ''));
                if (!isNaN(recNum) && recNum > maxReceiptNum) maxReceiptNum = recNum;
            }
        });
        globalReceiptCounter = maxReceiptNum + 1;

        if (expenseEntries.length > 0) {
            let maxVoucherNum = 1000;
            expenseEntries.forEach(e => {
                let vNum = parseInt((e.voucherno || e.voucher_no || e.voucherNo || "").replace('AF-EXP-', ''));
                if (!isNaN(vNum) && vNum > maxVoucherNum) maxVoucherNum = vNum;
            });
            globalExpenseCounter = maxVoucherNum + 1;
        }

        // ডাটাবেজ থেকে ডাটা পাওয়ার পর সাজানো নিশ্চিত করা হচ্ছে
        sortAllDataDescending();

        // ---- ডেটাবেজ থেকে লাইভ নোটিশ লোড করার কোড ----
        let liveTickerMessage = "আবাবিল ফাউন্ডেশন কার্যক্রমে আপনাকে স্বাগতম! আমাদের নতুন মানবিক প্রজেক্টের কার্যক্রম শুরু হয়েছে।";
        try {
            const { data: configData, error: configError } = await supabaseClient
                .from('admin_settings')
                .select('ticker_text')
                .eq('id', 'config')
                .single();
            if (!configError && configData && configData.ticker_text) {
                liveTickerMessage = configData.ticker_text;
            }
        } catch (err) {
            console.warn("লাইভ নোটিশ লোড করা যায়নি:", err.message);
        }

        globalTickerText = liveTickerMessage; // গ্লোবাল ভেরিয়েবলে সেভ করা হলো

        // হোম পেজে নোটিশ সেট করা
        const tickerEl = document.getElementById('liveTickerText');
        if (tickerEl) {
            tickerEl.innerText = globalTickerText;
        }
        // প্যানেলের ইনপুট বক্সে নোটিশ সেট করা
        const tickerInputEl = document.getElementById('tickerTextInput');
        if (tickerInputEl) {
            tickerInputEl.value = globalTickerText;
        }


        recalculateAllMembersDue();
        refreshAllData();
    } catch (err) {
        console.error("ডাটাবেজ কানেকশন ব্যর্থ:", err.message);
    }
}

function showCustomPopup(icon, titleText, showBtn = true) {
    document.getElementById('statusModalIcon').innerText = icon;
    document.getElementById('statusModalTitle').innerText = titleText;
    const btn = document.getElementById('statusModalBtn');
    btn.style.display = showBtn ? 'inline-block' : 'none';
    document.getElementById('statusModal').style.display = 'flex';
}

// এই ফাংশনটি গ্লোবাল করতে হবে যাতে HTML বাটন ক্লিক করতে পারে
window.closeCustomPopup = closeCustomPopup;
function closeCustomPopup() {
    document.getElementById('statusModal').style.display = 'none';
}

function syncAddressIfChecked() {
    const isChecked = document.getElementById('sameAddressCheckbox').checked;
    if (isChecked) {
        const permanentText = document.getElementById('regPermanentAddress').value;
        document.getElementById('regPresentAddress').value = permanentText;
    }
}

function copyPermanentToPresent(isChecked) {
    const presentInput = document.getElementById('regPresentAddress');
    if (isChecked) {
        presentInput.value = document.getElementById('regPermanentAddress').value;
    } else {
        presentInput.value = '';
    }
}

function handleMemberTypeChange(typeValue) {
    const amountBox = document.getElementById('dynamicAmountBox');
    const amountInput = document.getElementById('regMonthlyAmount');
    if (typeValue === 'মাসিক ধার্যকৃত সদস্য') {
        amountBox.style.display = 'flex';
        amountInput.required = true;
    } else {
        amountBox.style.display = 'none';
        amountInput.required = false;
        amountInput.value = '';
    }
}

function handleShortFormTypeChange(typeValue) {
    const group = document.getElementById('shortFormAmountGroup');
    const input = document.getElementById('newMemberAmount');
    if (typeValue === 'মাসিক ধার্যকৃত সদস্য') {
        group.style.display = 'flex';
        input.required = true;
    } else {
        group.style.display = 'none';
        input.required = false;
        input.value = '';
    }
}

function calculateIndividualDue(member) {
    if (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") {
        member.fixedTarget = 0;
        member.totalDue = 0;
        member.status = member.type === "রক্তদাতা" ? (member.status || "প্রস্তুত") : (member.type === "সাধারণ সদস্য" ? "সাধারণ সদস্য" : "স্থায়ী দাতা");
        member.totalPaidAccumulated = member.totalPaidAccumulated || 0;
        return;
    }

    if (member.paidMonths && typeof member.paidMonths === 'string') {
        try {
            let trimmed = member.paidMonths.trim();
            if (trimmed.startsWith('[')) {
                member.paidMonths = JSON.parse(trimmed);
            } else {
                member.paidMonths = trimmed.split(',')
                    .map(m => m.replace(/[\[\]"']/g, '').trim())
                    .filter(m => m !== '');
            }
        } catch (e) {
            member.paidMonths = member.paidMonths.split(',')
                .map(m => m.replace(/[\[\]"']/g, '').trim())
                .filter(m => m !== '');
        }
    }
    if (!Array.isArray(member.paidMonths)) {
        member.paidMonths = [];
    }

    let totalMonthsApplicable = currentCalendarMonthIndex + 1;
    let paidCountInCurrentRange = 0;

    for (let i = 0; i <= currentCalendarMonthIndex; i++) {
        if (member.paidMonths.includes(banglaMonths[i])) {
            paidCountInCurrentRange++;
        }
    }
    let dueMonthsCount = totalMonthsApplicable - paidCountInCurrentRange;
    if (dueMonthsCount < 0) dueMonthsCount = 0;
    member.totalDue = dueMonthsCount * member.fixedTarget;
    member.status = member.totalDue === 0 ? "বকেয়ামুক্ত" : "বকেয়া";
    member.totalPaidAccumulated = member.paidMonths.length * member.fixedTarget;
}

function recalculateAllMembersDue() {
    membersData.forEach(member => {
        calculateIndividualDue(member);
    });
}

window.onload = function () {


    const initialHash = window.location.hash.replace('#', '') || 'homeView';
    window.history.replaceState({ sectionId: initialHash, pointer: 0 }, '', '#' + initialHash);

    loadAllDataFromSupabase().then(() => {
        initializeDashboard();
        showSection(initialHash, true);
        renderHomeCharts();
        triggerHomeAnimations();
    });
};

function initializeDashboard() {

    renderBloodTable();

    renderPublicMemberList();

    renderExpenseTable();
    populateReceiptDropdown();


    const titleEl = document.getElementById('currentPageTitle');
    if (titleEl) {
        titleEl.innerText = pageTitles['homeView'];
    }

    window.addEventListener('click', function (e) {
        if (!e.target.matches('.three-dots-btn')) {
            document.querySelectorAll('.action-dropdown').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
}

// ==================================================
// 📊 গ্রাফ চার্ট লজিক এরিয়া (Chart.js)
// ==================================================
function getMonthlyIncomeData() {
    let monthlyValues = new Array(12).fill(0);

    membersData.forEach(m => {
        let monthsArray = [];
        if (Array.isArray(m.paidMonths)) {
            monthsArray = m.paidMonths;
        } else if (typeof m.paidMonths === 'string') {
            try {
                monthsArray = JSON.parse(m.paidMonths);
            } catch (e) {
                monthsArray = m.paidMonths.split(',').map(s => s.trim());
            }
        }
        monthsArray.forEach(mon => {
            let idx = banglaMonths.indexOf(mon);
            if (idx > -1) {
                monthlyValues[idx] += (parseInt(m.fixedTarget) || 0);
            }
        });
    });

    donationEntries.forEach(d => {
        if (d.date) {
            let parts = d.date.split('/');
            if (parts.length === 3) {
                let mIdx = parseInt(parts[1]) - 1;
                if (mIdx >= 0 && mIdx < 12) {
                    monthlyValues[mIdx] += (parseInt(d.amount) || 0);
                }
            }
        }
    });
    return monthlyValues;
}

function getMonthlyExpenseData() {
    let monthlyValues = new Array(12).fill(0);
    expenseEntries.forEach(e => {
        if (e.date) {
            let parts = e.date.split('/');
            if (parts.length === 3) {
                let mIdx = parseInt(parts[1]) - 1;
                if (mIdx >= 0 && mIdx < 12) {
                    monthlyValues[mIdx] += (parseInt(e.amount) || 0);
                }
            }
        }
    });
    return monthlyValues;
}

function renderHomeCharts() {
    const incomeData = getMonthlyIncomeData();
    const expenseData = getMonthlyExpenseData();

    const gradualAnimationConfig = {
        duration: 2000,
        easing: 'easeOutQuart',
        delay: (context) => {
            let delay = 0;
            if (context.type === 'data' && context.mode === 'default') {
                delay = context.dataIndex * 100;
            }
            return delay;
        }
    };

    const ctxIncome = document.getElementById('incomeHomeChart').getContext('2d');
    if (incomeChartInstance) incomeChartInstance.destroy();
    incomeChartInstance = new Chart(ctxIncome, {
        type: 'bar',
        data: {
            labels: banglaMonths,
            datasets: [{
                label: 'আয় (টাকা)',
                data: incomeData,
                backgroundColor: 'rgba(30, 64, 175, 0.75)',
                borderColor: 'rgba(30, 64, 175, 1)',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            animation: gradualAnimationConfig,
            scales: {
                y: { beginAtZero: true, ticks: { font: { family: 'Kalpurush', size: 10 } } },
                x: { ticks: { font: { family: 'Kalpurush', size: 9 } } }
            }
        }
    });

    const ctxExpense = document.getElementById('expenseHomeChart').getContext('2d');
    if (expenseChartInstance) expenseChartInstance.destroy();
    expenseChartInstance = new Chart(ctxExpense, {
        type: 'bar',
        data: {
            labels: banglaMonths,
            datasets: [{
                label: 'ব্যয় (টাকা)',
                data: expenseData,
                backgroundColor: 'rgba(239, 68, 68, 0.75)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            animation: gradualAnimationConfig,
            scales: {
                y: { beginAtZero: true, ticks: { font: { family: 'Kalpurush', size: 10 } } },
                x: { ticks: { font: { family: 'Kalpurush', size: 9 } } }
            }
        }
    });
}

function toggleActionMenu(event, id) {
    if (event) event.stopPropagation();
    const targetDropdown = document.getElementById('dropdown-' + id);
    document.querySelectorAll('.action-dropdown').forEach(dropdown => {
        if (dropdown.id !== 'dropdown-' + id) dropdown.classList.remove('show');
    });
    targetDropdown.classList.toggle('show');
}































































































































function refreshAllData() {
    sortAllDataDescending();



    renderBloodTable();

    renderPublicMemberList();
    updateIncomeStatistics('1m');


    renderExpenseTable();
    populateReceiptDropdown();
    generateReceipt();
    renderHomeCharts();

    // ---- লাইভ তথ্য বারের লেখা ডাইনামিক করার অংশ ----
    const totalDonors = membersData.filter(m => m.blood && m.blood !== '---' && m.blood.trim() !== "").length;
    const totalMembers = membersData.filter(m => m.type !== "রক্তদাতা").length;

    const dynamicTickerMessage = `আবাবিল ফাউন্ডেশন ডিজিটাল ডাটাবেজে আপনাকে স্বাগতম! বর্তমানে আমাদের মোট সাধারণ সদস্য: ${translateToBengaliNumber(totalMembers)} জন এবং নিবন্ধিত রক্তদাতা: ${translateToBengaliNumber(totalDonors)} জন। জরুরি রক্তের প্রয়োজনে আমাদের ব্লাড ব্যাংক অপশনটি ব্যবহার করুন। ধন্যবাদ।`;

    // ---- লাইভ তথ্য বারের লেখা সেট করার অংশ ----
    const tickerEl = document.getElementById('liveTickerText');
    if (tickerEl) {
        // যদি ডাটাবেজে আপনার সেভ করা কাস্টম নোটিশ থাকে তবে সেটি দেখাবে, অন্যথায় স্বয়ংক্রিয় ডাইনামিক তথ্য দেখাবে
        if (globalTickerText && globalTickerText.trim() !== "") {
            tickerEl.innerText = globalTickerText;
        } else {
            const totalDonors = membersData.filter(m => m.blood && m.blood !== '---' && m.blood.trim() !== "").length;
            const totalMembers = membersData.filter(m => m.type !== "রক্তদাতা").length;
            const dynamicTickerMessage = `আবাবিল ফাউন্ডেশন ডিজিটাল ডাটাবেজে আপনাকে স্বাগতম! বর্তমানে আমাদের মোট সাধারণ সদস্য: ${translateToBengaliNumber(totalMembers)} জন এবং নিবন্ধিত রক্তদাতা: ${translateToBengaliNumber(totalDonors)} জন। জরুরি রক্তের প্রয়োজনে আমাদের ব্লাড ব্যাংক অপশনটি ব্যবহার করুন। ধন্যবাদ।`;
            tickerEl.innerText = dynamicTickerMessage;
        }
    }
    // ---------------------------------------------
            updateDynamicStats(); 
}

















function openMenu() {
    document.getElementById('myPopup').style.display = 'block';
    document.getElementById('floatingMenuBtn').style.opacity = '0';
    document.getElementById('floatingMenuBtn').style.pointerEvents = 'none';
}

function closeMenu() {
    document.getElementById('myPopup').style.display = 'none';
    document.getElementById('floatingMenuBtn').style.opacity = '1';
    document.getElementById('floatingMenuBtn').style.pointerEvents = 'auto';
}

function closeMenuOutside(event) {
    if (event.target.id === 'myPopup') closeMenu();
}





























function syncPledgeName(nameValue) {
    const pledgeSpan = document.getElementById('pledgeDynamicName');
    pledgeSpan.innerText = nameValue.trim() !== "" ? nameValue : "........................";
}

// ==================================================
// 📝 সরাসরি সাবমিট প্রক্রিয়া ও চেকবক্স লজিক 
// ==================================================
function toggleSubmitButton(isChecked) {
    document.getElementById('regSubmitBtn').disabled = !isChecked;
}

async function handleDirectRegistration(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value;
    const father = document.getElementById('regFatherName').value;
    const mother = document.getElementById('regMotherName').value;

    // ৩টি ভিন্ন ইনপুট থেকে দিন, মাস ও বছর সংগ্রহ করা হচ্ছে
    const dobDay = document.getElementById('regDobDay').value.padStart(2, '0');
    const dobMonth = document.getElementById('regDobMonth').value.padStart(2, '0');
    const dobYear = document.getElementById('regDobYear').value;
    // পূর্বের ডাটাবেজ ফরমেটের (YYYY-MM-DD) সাথে সামঞ্জস্য রেখে এক করা হচ্ছে
    const dob = `${dobYear}-${dobMonth}-${dobDay}`;
    const nationality = document.getElementById('regNationality').value;
    const religion = document.getElementById('regReligion').value;
    const profession = document.getElementById('regProfession').value;
    const phone = document.getElementById('regPhone').value;
    const permAddress = document.getElementById('regPermanentAddress').value;
    const presAddress = document.getElementById('regPresentAddress').value;
    const memberType = document.getElementById('regMemberType').value;
    const joinBloodBank = document.getElementById('regJoinBloodBank').value;

    let amount = 0;
    if (memberType === 'মাসিক ধার্যকৃত সদস্য') {
        amount = parseInt(document.getElementById('regMonthlyAmount').value) || 0;
    }
    const blood = document.getElementById('regBloodGroup').value;
    const bloodVal = joinBloodBank === 'না' ? (blood + ' (No)') : blood;

    showCustomPopup("⏳", "আপনার তথ্য প্রক্রিয়াকরণ হচ্ছে, অনুগ্রহ করে ৩ সেকেন্ড অপেক্ষা করুন...", false);

    setTimeout(async () => {
        const id = 'AF-' + autoIdCounter;
        const newMember = {
            id: id, name: name, fatherName: father, motherName: mother, dob: dob,
            nationality: nationality, religion: religion, profession: profession,
            phone: phone, permAddress: permAddress, address: presAddress, type: memberType,
            fixedTarget: amount, blood: bloodVal, lastPaid: 0, lastPaidAmount: 0, lastPaidMonths: [], paidMonths: [],
            totalDue: 0, totalPaidAccumulated: 0, status: "", latestReceiptNo: "", receiptSent: false
        };

        calculateIndividualDue(newMember);

        try {
            const { error } = await supabaseClient
                .from('members')
                .insert([newMember]);
            if (error) throw error;

            membersData.push(newMember);
            autoIdCounter++;

            closeCustomPopup();

            document.getElementById('successPopUpModal').style.display = 'flex';
            document.getElementById('mainRegistrationForm').reset();
            document.getElementById('dynamicAmountBox').style.display = 'none';
            document.getElementById('pledgeDynamicName').innerText = "........................";
            document.getElementById('regSubmitBtn').disabled = true;

            refreshAllData();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: সদস্য নিবন্ধন করা যায়নি।", true);
        }
    }, 3000);
}

function closeSuccessModal() {
    document.getElementById('successPopUpModal').style.display = 'none';
    showSection('homeView');
}







































































function showSection(sectionId, isNavigating = false) {
    window.scrollTo(0, 0);

    const sections = ['homeView', 'regFormSection', 'memberListSection', 'incomeSection', 'expenseSection', 'bloodBankSection', 'receiptSection'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'none';
        }
    });

    const targetEl = document.getElementById(sectionId);
    if (targetEl) {
        targetEl.style.display = 'block';
    }



    const titleElement = document.getElementById('currentPageTitle');
    if (titleElement && pageTitles[sectionId]) {
        titleElement.innerText = pageTitles[sectionId];
    }

    if (!isNavigating) {
        historyPointer++;
        pageHistory = pageHistory.slice(0, historyPointer);
        pageHistory.push(sectionId);
        window.history.pushState({ sectionId: sectionId, pointer: historyPointer }, '', '#' + sectionId);
    }
    currentSectionId = sectionId;

    closeMenu();
    if (sectionId === 'incomeSection') updateIncomeStatistics('1m');
    if (sectionId === 'memberListSection') renderPublicMemberList();

    if (sectionId === 'homeView') {
        setTimeout(renderHomeCharts, 120);
        setTimeout(triggerHomeAnimations, 200);
    }

    document.querySelectorAll('.bottom-nav-item').forEach(link => {
        link.classList.remove('active');
    });

    let mobNavItems = document.querySelectorAll('.bottom-nav-item');
    if (sectionId === 'homeView' && mobNavItems[0]) mobNavItems[0].classList.add('active');
    if (sectionId === 'regFormSection' && mobNavItems[1]) mobNavItems[1].classList.add('active');
    if (sectionId === 'bloodBankSection' && mobNavItems[2]) mobNavItems[2].classList.add('active');


    updateNavigationButtons();
}















































































function goBack() {
    if (historyPointer > 0) {
        window.history.back();
    }
}

function goForward() {
    if (historyPointer < pageHistory.length - 1) {
        window.history.forward();
    }
}

function updateNavigationButtons() {
    document.querySelectorAll('.btn-nav-back').forEach(btn => {
        if (historyPointer > 0) {
            btn.classList.remove('btn-disabled');
        } else {
            btn.classList.add('btn-disabled');
        }
    });

    document.querySelectorAll('.btn-nav-forward').forEach(btn => {
        if (historyPointer < pageHistory.length - 1) {
            btn.classList.remove('btn-disabled');
        } else {
            btn.classList.add('btn-disabled');
        }
    });
}

function toggleAccordion(containerId, iconId) {
    const content = document.getElementById(containerId);
    const icon = document.getElementById(iconId);
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.innerText = '▲';
    } else {
        content.style.display = 'none';
        icon.innerText = '▼';
    }
}

function liveSearchIncome() {
    let value = document.getElementById('incomeSearchInput').value.toLowerCase().trim();
    let table = document.getElementById('mainIncomeTable');
    let tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        let idOrReceiptCell = tr[i].getElementsByTagName('td')[1];
        let sourceCell = tr[i].getElementsByTagName('td')[2];
        let descCell = tr[i].getElementsByTagName('td')[3];

        if (idOrReceiptCell || sourceCell || descCell) {
            let idText = (idOrReceiptCell.textContent || idOrReceiptCell.innerText).toLowerCase();
            let srcText = (sourceCell.textContent || sourceCell.innerText).toLowerCase();
            let descText = (descCell.textContent || descCell.innerText).toLowerCase();

            if (idText.indexOf(value) > -1 || srcText.indexOf(value) > -1 || descText.indexOf(value) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}























function updateIncomeStatistics(period) {
    document.querySelectorAll('#incomeSection .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (period === '1m') document.getElementById('btn1m').classList.add('active');
    if (period === '6m') document.getElementById('btn6m').classList.add('active');
    if (period === '1y') document.getElementById('btn1y').classList.add('active');

    let memberIncomeSum = membersData.reduce((sum, m) => sum + (parseInt(m.totalPaidAccumulated) || 0), 0);
    let extraDonationSum = donationEntries.reduce((sum, e) => sum + e.amount, 0);
    let grandTotalIncome = memberIncomeSum + extraDonationSum;

    document.getElementById('totalIncomeAmount').innerText = grandTotalIncome.toLocaleString('bn-BD') + '/-';
    document.getElementById('incomePeriodTitle').innerText = `সর্বমোট আয়ের পরিসংখ্যান (${period === '1m' ? 'শেষ ১ মাস' : period === '6m' ? 'শেষ ৬ মাস' : 'শেষ ১ বছর'})`;

    let tableHtml = '';

    if (membersData.some(m => m.lastPaid > 0) || donationEntries.length > 0) {
        membersData.forEach(m => {
            if (m.lastPaid > 0) {
                let rNo = m.latestReceiptNo || "AF-REC-1000";
                let truncatedName = truncateText(m.name, 25, 'বিবরণ/সংগ্রাহক');
                tableHtml += `<tr>
                    <td data-label="তারিখ">২৬/০৫/২০২৬</td>
                    <td data-label="রশিদ নং"><span style='color:var(--primary); font-weight:bold;'>${rNo} (${m.id})</span></td>
                    <td data-label="খাত">মাসিক ধার্য চাঁদা</td>
                    <td data-label="বিবরণ">${truncatedName}</td>
                    <td data-label="পরিমাণ" style="color:var(--primary); font-weight:bold;">${m.lastPaid}/-</td>
                    <td data-label="অবস্তার"><span class="badge badge-success">অনুমোদিত</span></td>
                </tr>`;
            }
        });
        donationEntries.forEach(e => {
            let truncatedSector = truncateText(e.sector, 25, 'আয়ের খাত/উৎস');
            let truncatedDonor = truncateText(`${e.name} (${e.address})`, 25, 'বিবরণ/সংগ্রাহক');
            tableHtml += `<tr>
                <td data-label="তারিখ">${e.date}</td>
                <td data-label="রশিদ নং"><span style='color:var(--primary); font-weight:bold;'>${e.receiptNo}</span></td>
                <td data-label="খাত">${truncatedSector}</td>
                <td data-label="বিবরণ">${truncatedDonor}</td>
                <td data-label="পরিমাণ" style="color:var(--primary); font-weight:bold;">${e.amount}/-</td>
                <td data-label="অবস্থা"><span class="badge badge-success">অনুমোদিত</span></td>
            </tr>`;
        });
    } else {
        tableHtml += `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); font-style:italic;">কোনো আয়ের রেকর্ড এখনো যোগ করা হয়নি।</td></tr>`;
    }

    document.getElementById('incomeTableBody').innerHTML = tableHtml;
    liveSearchIncome();
}





























































function renderPublicMemberList() {
    const tbody = document.getElementById('publicMemberListBody');
    if (!tbody) return;

    const generalMembers = membersData.filter(m => m.type !== "রক্তদাতা");

    if (generalMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); font-style:italic;">কোনো সদস্যের তথ্য পাওয়া যায়নি।</td></tr>`;
        return;
    }

    let html = '';
    generalMembers.forEach((m, index) => {
        let fullAddress = m.address || m.permAddress || '---';
        html += `<tr>
            <td data-label="ক্রমিক">${index + 1}</td>
            <td data-label="সদস্যের নাম" style="font-weight:600;">${m.name}</td>
            <td data-label="ঠিকানা">${fullAddress}</td>
            <td data-label="মোবাইল নম্বর">${m.phone}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

async function sendReceipt(memberId) {
    let member = membersData.find(m => m.id === memberId);
    if (member) {
        member.receiptSent = true;

        showCustomPopup("⏳", "রশিদ তৈরি হচ্ছে.....", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .update({ receiptSent: true })
                .eq('id', memberId);
            if (error) throw error;

            renderTargetTable();
            setTimeout(() => {
                closeCustomPopup();
                showMemberReceiptDirect(memberId);
            }, 1000);
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: রশিদ পাঠানো সফল হয়নি।", true);
        }
    }
}

function showMemberReceiptDirect(memberId) {
    showSection('receiptSection');
    document.getElementById('receiptMemberSelect').value = memberId;
    generateReceipt();
}









function openMemberModal(id) {
    selectedMemberId = id;
    const member = membersData.find(m => m.id === id);
    if (member) {
        calculateIndividualDue(member);
        document.getElementById('profName').innerText = member.name;
        document.getElementById('profId').innerText = member.id;
        document.getElementById('profType').innerText = member.type;
        document.getElementById('profPhone').innerText = member.phone;
        document.getElementById('profBlood').innerText = member.blood ? member.blood.replace(' (No)', '').replace(' (N)', '') : '---';
        document.getElementById('profAddress').innerText = member.address;

        document.getElementById('profFixedTarget').innerText = (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" ? member.type : member.fixedTarget + '/-');

        tempPaidMonths = [...member.paidMonths];
        initialPaidMonths = [...member.paidMonths];

        updateModalTemporaryDues(member);

        if (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") {
            document.getElementById('monthListTitle').style.display = 'none';
            document.getElementById('monthsGridContainer').style.display = 'none';
        } else {
            document.getElementById('monthListTitle').style.display = 'block';
            document.getElementById('monthsGridContainer').style.display = 'grid';
            renderMonthsGrid(member);
        }
        document.getElementById('memberProfileModal').style.display = 'flex';
    }
}

function updateModalTemporaryDues(member) {
    if (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") {
        document.getElementById('profTotalDue').innerText = '০/-';
        document.getElementById('profTotalPaid').innerText = (member.totalPaidAccumulated || 0) + '/-';
        return;
    }
    let totalMonthsApplicable = currentCalendarMonthIndex + 1;
    let paidCountInCurrentRange = 0;
    for (let i = 0; i <= currentCalendarMonthIndex; i++) {
        if (tempPaidMonths.includes(banglaMonths[i])) {
            paidCountInCurrentRange++;
        }
    }
    let dueMonthsCount = totalMonthsApplicable - paidCountInCurrentRange;
    if (dueMonthsCount < 0) dueMonthsCount = 0;

    let tempDue = dueMonthsCount * member.fixedTarget;
    let tempPaidAccumulated = tempPaidMonths.length * member.fixedTarget;

    document.getElementById('profTotalDue').innerText = tempDue + '/-';
    document.getElementById('profTotalPaid').innerText = tempPaidAccumulated + '/-';
}

function renderMonthsGrid(member) {
    const container = document.getElementById('monthsGridContainer');
    container.innerHTML = '';
    banglaMonths.forEach(month => {
        const isPaid = tempPaidMonths.includes(month);
        const card = document.createElement('div');
        card.className = `month-card ${isPaid ? 'paid' : ''}`;
        card.innerHTML = `<span class="month-name">${month}</span><span class="month-amount">${isPaid ? '✅ পরিশোধিত' : member.fixedTarget + '/-'}</span>`;
        // card.onclick = function () { toggleMonthPaymentTemp(member.id, month); };
        container.appendChild(card);
    });
}



























































function closeMemberModal() { document.getElementById('memberProfileModal').style.display = 'none'; }
function closeModalOutside(event) { if (event.target.id === 'memberProfileModal') closeMemberModal(); }

function toggleMemberDetailsRow(id) {
    const detailsDiv = document.getElementById('details-row-' + id);
    const icon = document.getElementById('toggle-icon-' + id);
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = (window.innerWidth <= 768) ? 'block' : 'table-row';
        icon.innerText = '▲';
        icon.style.backgroundColor = 'var(--primary)';
        icon.style.color = '#ffffff';
    } else {
        detailsDiv.style.display = 'none';
        icon.innerText = '▼';
        icon.style.backgroundColor = '#f1f5f9';
        icon.style.color = 'var(--primary)';
    }
}














































function renderBloodTable(filterGroup = 'All') {
    let html = '';
    let count = 0;
    const gridContainer = document.getElementById('bloodDonorGrid');
    if (!gridContainer) return;

    if (membersData.length === 0) {
        gridContainer.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-style:italic; grid-column: 1/-1; padding: 20px;">ব্লাড ব্যাংকে কোনো রেকর্ড নেই।</div>`;
        document.getElementById('totalDonorsCount').innerText = '০ জন';
        return;
    }

    membersData.forEach(m => {
        if (!m.blood || m.blood.trim() === "" || m.blood === "---" || m.blood.includes("(No)")) return;

        if (filterGroup !== 'All') {
            if (filterGroup === 'O-' && m.blood !== 'O-') return;
            if (filterGroup === 'A-' && m.blood !== 'A-') return;
            if (filterGroup !== 'O-' && filterGroup !== 'A-' && m.blood !== filterGroup) return;
        }
        count++;

        let donorAddress = m.address || '---';

        // --- ৩ মাস (৯০ দিন) স্বয়ংক্রিয় দিন ও মাস গণনার লজিক ---
        let donorStatus = 'প্রস্তুত';
        let countdownText = 'রক্তদানে প্রস্তুত';
        let statusBadgeClass = 'status-ready';
        let isEligibleToDonate = true; // বাটন দেখানোর ফ্ল্যাগ

        if (m.last_donation_date) {
            // আমাদের তৈরি করা ক্রস-ব্রাউজার নিরাপদ ডেট পার্সার ব্যবহার
            let lastDate = parseLocalDate(m.last_donation_date);

            if (lastDate) {
                let nextDate = new Date(lastDate);
                nextDate.setMonth(nextDate.getMonth() + 3); // ৩ মাস পরবর্তী তারিখ

                let today = new Date();
                today.setHours(0, 0, 0, 0);
                nextDate.setHours(0, 0, 0, 0);

                // যদি ৩ মাস পার না হয়ে থাকে (রক্তদানে এখনও বাকি আছে)
                if (today < nextDate) {
                    donorStatus = 'অপ্রস্তুত';
                    isEligibleToDonate = false; // ৩ মাস পার হওয়ার আগে বাটন দেখাবে না

                    // মাস এবং দিন আলাদা করার হিসাব
                    let tempDate = new Date(today);
                    let diffMonths = 0;
                    while (tempDate < nextDate) {
                        tempDate.setMonth(tempDate.getMonth() + 1);
                        if (tempDate <= nextDate) {
                            diffMonths++;
                        } else {
                            tempDate.setMonth(tempDate.getMonth() - 1);
                            break;
                        }
                    }
                    let diffDays = Math.floor((nextDate - tempDate) / (1000 * 60 * 60 * 24));

                    // বাংলায় সংখ্যা রূপান্তর
                    let bnMonths = translateToBengaliNumber(diffMonths);
                    let bnDays = translateToBengaliNumber(diffDays);

                    if (diffMonths > 0 && diffDays > 0) {
                        countdownText = `রক্তদানে বাকি: ${bnMonths} মাস ${bnDays} দিন`;
                    } else if (diffMonths > 0) {
                        countdownText = `রক্তদানে বাকি: ${bnMonths} মাস`;
                    } else {
                        countdownText = `রক্তদানে বাকি: ${bnDays} দিন`;
                    }
                    statusBadgeClass = 'status-not-ready';
                }
            }
        }

        let donationCount = m.donation_count || 0;
        let cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';

        let whatsappPhone = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone;
        let whatsappLink = `https://wa.me/${whatsappPhone}?text=আসসালামু আলাইকুম, আবাবিল ব্লাড ব্যাংকের মাধ্যমে আপনার রক্তদাতার তথ্য পেয়ে যোগাযোগ করছি। আপনি কি এখন রক্তদানে প্রস্তুত আছেন?`;

        // রক্তদানের ৩ মাস পার হয়ে প্রস্তুত হলে কেবল তখনই বাটনটি রেন্ডার হবে
        let entryButtonHtml = '';
        if (isEligibleToDonate) {
            entryButtonHtml = `
            <!-- পপআপ ওপেন করার বাটন -->
            <button onclick="openQuickDonationModal('${m.id}')" style="background-color: #ffe4e6; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 6px; padding: 5px 8px; font-size: 10.5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 8px; width: 100%; box-sizing: border-box;">
                📅 রক্তদানের তারিখ এন্ট্রি
            </button>
            `;
        }

        html += `
        <div class="donor-card" data-name="${m.name.toLowerCase()}" data-blood="${m.blood.toLowerCase()}" data-address="${donorAddress.toLowerCase()}">
            <div class="donor-card-header">
                <div class="donor-blood-badge">${m.blood}</div>
                <div class="donor-meta">
                    <h4 class="donor-name">${m.name}</h4>
                    <p class="donor-location">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 2px;"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                        ${donorAddress}
                    </p>
                </div>
                <div class="action-dropdown" id="dropdown-blood-${m.id}" style="position: absolute; right: 0; top: 0;">
                    <button class="three-dots-btn" onclick="toggleActionMenu(event, 'blood-${m.id}')">⋮</button>
                    <div class="dropdown-menu-content">
                        <button class="btn-edit" onclick="editBloodDonor('${m.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteBloodDonor('${m.id}')">Delete</button>
                    </div>
                </div>
            </div>
            
            <div class="donor-card-body">
                <div class="donor-status-indicator ${statusBadgeClass}" style="margin-bottom: 6px;">
                    <span class="status-dot"></span>
                    ${countdownText}
                </div>
                <div style="font-size: 11px; color: var(--text-main); font-weight: bold; margin-left: 4px;">
                    🩸 মোট রক্তদান: ${donationCount} বার
                </div>
                
                ${entryButtonHtml}
            </div>
            
            <div class="donor-card-actions" style="margin-top: 8px;">
                <a href="tel:${m.phone}" class="donor-action-btn call-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    সরাসরি কল
                </a>
                <a href="${whatsappLink}" target="_blank" class="donor-action-btn whatsapp-btn">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.705 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    হোয়াটসঅ্যাপ
                </a>
            </div>
        </div>`;
    });

    gridContainer.innerHTML = html;
    document.getElementById('totalDonorsCount').innerText = count + ' জন';
}

function editBloodDonor(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (member) {
        document.getElementById('editDonorId').value = member.id;
        document.getElementById('editDonorName').value = member.name;
        document.getElementById('editDonorAddress').value = member.address || member.permAddress || '';
        document.getElementById('editDonorBloodGroup').value = member.blood || 'O+';
        document.getElementById('editDonorPhone').value = member.phone;

        // ডাটাবেজের YYYY-MM-DD ফরম্যাট থেকে ভিউয়ার ও এডিটের জন্য DD/MM/YYYY ফরম্যাটে রূপান্তর
        let displayDate = '';
        if (member.last_donation_date) {
            const parsedDate = parseLocalDate(member.last_donation_date);
            if (parsedDate) {
                displayDate = `${String(parsedDate.getDate()).padStart(2, '0')}/${String(parsedDate.getMonth() + 1).padStart(2, '0')}/${parsedDate.getFullYear()}`;
            }
        }
        document.getElementById('editDonorLastDonationDate').value = displayDate;
        document.getElementById('editDonorDonationCount').value = member.donation_count || 0;

        document.getElementById('editBloodDonorModal').style.display = 'flex';
    }
}

function closeEditBloodDonorModal() {
    document.getElementById('editBloodDonorModal').style.display = 'none';
}

function closeEditBloodDonorModalOutside(event) {
    if (event.target.id === 'editBloodDonorModal') closeEditBloodDonorModal();
}

async function saveEditedBloodDonor(event) {
    event.preventDefault();
    const id = document.getElementById('editDonorId').value;
    const member = membersData.find(m => m.id === id);
    if (member) {
        member.name = document.getElementById('editDonorName').value;
        member.address = document.getElementById('editDonorAddress').value;
        member.blood = document.getElementById('editDonorBloodGroup').value;
        member.phone = document.getElementById('editDonorPhone').value;

        // এডিট করা তারিখটি সঠিকভাবে প্রসেস করা
        const rawEditDate = document.getElementById('editDonorLastDonationDate').value.trim();
        let dbEditDate = null;
        if (rawEditDate) {
            const parsedDate = parseLocalDate(rawEditDate);
            if (!parsedDate) {
                showCustomPopup("⚠️", "রক্তদানের তারিখটি সঠিক ফরম্যাটে লিখুন (দিন/মাস/বছর)। যেমন: 10/06/2026", true);
                return;
            }
            dbEditDate = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
        }

        member.last_donation_date = dbEditDate;
        member.donation_count = parseInt(document.getElementById('editDonorDonationCount').value) || 0;

        showCustomPopup("⏳", "রক্তদাতার তথ্য আপডেট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .update({
                    name: member.name,
                    address: member.address,
                    blood: member.blood,
                    phone: member.phone,
                    last_donation_date: member.last_donation_date,
                    donation_count: member.donation_count
                })
                .eq('id', id);
            if (error) throw error;

            closeEditBloodDonorModal();
            closeCustomPopup();
            showCustomPopup("✅", 'রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', true);
            refreshAllData();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: তথ্য সংরক্ষণ করা সম্ভব হয়নি।", true);
        }
    }
}

function deleteBloodDonor(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (!member) return;

    showConfirmModal("আপনি কি নিশ্চিত যে এই রক্তদাতার তথ্য মুছে ফেলতে চান?", function () {
        executeDeleteBloodDonor(memberId);
    });
}

async function executeDeleteBloodDonor(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (!member) return;

    showCustomPopup("⏳", "ব্লাড ব্যাংক থেকে তথ্য মুছে ফেলা হচ্ছে...", false);
    try {
        if (member.type === "রক্তদাতা") {
            const { error } = await supabaseClient
                .from('members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
            membersData = membersData.filter(m => m.id !== memberId);
        } else {
            const { error } = await supabaseClient
                .from('members')
                .update({ blood: "" })
                .eq('id', memberId);
            if (error) throw error;
            member.blood = "";
        }

        closeCustomPopup();
        showCustomPopup("✅", 'ব্লাড ব্যাংক থেকে সফলভাবে বাদ দেওয়া হয়েছে!', true);
        refreshAllData();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: তথ্য মুছে ফেলা সম্ভব হয়নি।", true);
    }
}

function filterBlood(group, element) {
    document.querySelectorAll('#bloodBankSection .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else if (window.event) {
        window.event.target.classList.add('active');
    }
    renderBloodTable(group);
}

//  রক্তদাতা অনুসন্ধানকারী ফাংশন
function searchBloodDonor() {
    let input = document.getElementById('bloodSearchInput').value.toLowerCase().trim();
    let cards = document.querySelectorAll('#bloodDonorGrid .donor-card');

    cards.forEach(card => {
        let name = card.getAttribute('data-name') || '';
        let blood = card.getAttribute('data-blood') || '';
        let address = card.getAttribute('data-address') || '';

        if (name.includes(input) || blood.includes(input) || address.includes(input)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

function openBloodDonorModal() {
    document.getElementById('bloodDonorModal').style.display = 'flex';
}

function closeBloodDonorModal() {
    document.getElementById('bloodDonorModal').style.display = 'none';
    document.getElementById('bloodDonorForm').reset();
}

function closeBloodDonorModalOutside(event) {
    if (event.target.id === 'bloodDonorModal') closeBloodDonorModal();
}

async function saveBloodDonor(event) {
    event.preventDefault();
    const name = document.getElementById('donorName').value.trim();
    const address = document.getElementById('donorAddress').value.trim();
    const blood = document.getElementById('donorBloodGroup').value;
    const phone = document.getElementById('donorPhone').value.trim();

    // টাইপ করা তারিখটিকে ডাটাবেজের জন্য YYYY-MM-DD ফরম্যাটে কনভার্ট করা
    const rawLastDonationDate = document.getElementById('donorLastDonationDate').value.trim();
    let lastDonationDate = null;
    if (rawLastDonationDate) {
        const parsedDate = parseLocalDate(rawLastDonationDate);
        if (!parsedDate) {
            showCustomPopup("⚠️", "সর্বশেষ রক্তদানের তারিখটি সঠিক ফরম্যাটে লিখুন (দিন/মাস/বছর)। যেমন: 10/06/2026", true);
            return;
        }
        lastDonationDate = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`;
    }

    const donationCount = parseInt(document.getElementById('donorDonationCount').value) || 0;

    // ব্লাড ব্যাংকে মোবাইল নম্বর দিয়ে ডুপ্লিকেট এন্ট্রি চেক
    const isDuplicate = membersData.some(m => {
        return m.phone && m.phone.trim() === phone && m.blood && m.blood !== "---" && m.blood.trim() !== "";
    });

    // তথ্য ইতিমধ্যে এন্ট্রি থাকলে ফরম বন্ধ হয়ে ওয়ার্নিং আইকন সহ পপআপ বার্তা আসবে
    if (isDuplicate) {
        closeBloodDonorModal(); // ফরমটি বন্ধ এবং রিসেট হয়ে যাবে
        showCustomPopup("⚠️", "আপনার তথ্যটি ডাটাবেজে সংরক্ষিত রয়েছে।", true); // ⚠️ ওয়ার্নিং আইকন সহ পপআপ শো করবে
        return; // পরবর্তী প্রসেস এখানেই শেষ হবে
    }

    const id = 'BD-' + autoIdCounter;

    const newDonor = {
        id: id, name: name, address: address, blood: blood, phone: phone,
        last_donation_date: lastDonationDate, donation_count: donationCount,
        type: "রক্তদাতা", fixedTarget: 0, lastPaid: 0, lastPaidAmount: 0, lastPaidMonths: [],
        paidMonths: [], totalDue: 0, totalPaidAccumulated: 0, latestReceiptNo: "", receiptSent: false
    };

    showCustomPopup("⏳", "রক্তদাতা যুক্ত হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('members')
            .insert([newDonor]);
        if (error) throw error;

        membersData.push(newDonor);
        autoIdCounter++;
        closeBloodDonorModal();
        closeCustomPopup();
        refreshAllData();
    } catch (err) {
        console.error("Error saving blood donor:", err);
        closeCustomPopup();
        // ডাটাবেজের সুনির্দিষ্ট ত্রুটির বার্তা পপআপে দেখাবে
        showCustomPopup("❌", "ত্রুটি: " + (err.message || "রক্তদাতা সংরক্ষণ করা সম্ভব হয়নি।"), true);
    }
}

function populateReceiptDropdown() {
    const select = document.getElementById('receiptMemberSelect');
    if (!select) return;
    select.innerHTML = '';
    if (membersData.length === 0) {
        let option = document.createElement('option');
        option.text = "কোনো সদস্য নেই";
        select.appendChild(option);
        return;
    }
    let defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.text = "--- সদস্য নির্বাচন করুন ---";
    select.appendChild(defaultOpt);

    membersData.forEach(m => {
        let option = document.createElement('option');
        option.value = m.id;
        option.text = `${m.id} - ${m.name}`;
        select.appendChild(option);
    });
}

async function downloadReceipt() {
    const preparerName = document.getElementById('receiptPreparedBy').value.trim();
    if (!preparerName) {
        showCustomPopup("⚠️", "দয়া করে রশিদের নিচে 'প্রস্তুতকারক' এর নাম লিখুন।", true);
        return;
    }

    const element = document.getElementById('printReceiptArea');
    if (!element) return;

    let name = 'রশিদ';
    let memberId = '';
    const isMemberVisible = document.getElementById('memberReceiptView').style.display !== 'none';
    if (isMemberVisible) {
        name = document.getElementById('rName').innerText.trim() || 'সদস্য';
        memberId = document.getElementById('rId').innerText.trim() || '';
    } else {
        name = document.getElementById('donRName').innerText.trim() || 'দাতা';
    }

    const cleanName = name.replace(/[^a-zA-Z0-9\u0980-\u09FF_]/g, '_').replace(/__+/g, '_');
    const cleanMemberId = memberId.replace(/[^a-zA-Z0-9\u0980-\u09FF_]/g, '_').replace(/__+/g, '_');

    const pdfFileName = (isMemberVisible && cleanMemberId)
        ? `${cleanName}_${cleanMemberId}.pdf`
        : `${cleanName}.pdf`;

    showCustomPopup("⏳", "পিডিএফ তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", false);

    // বর্তমান স্ক্রল পজিশন সংরক্ষণ করে স্ক্রিনকে ওপরে স্ক্রল করা হলো
    const currentScrollY = window.scrollY;
    window.scrollTo(0, 0);

    try {
        // ব্রাউজারকে স্ক্রল সেট করার জন্য সামান্য সময় দেওয়া হলো
        await new Promise(resolve => setTimeout(resolve, 250));

        const opt = {
            margin: [15, 10, 15, 10], // এ৫ পেজে নিখুঁত সেন্টারিং মার্জিন
            filename: pdfFileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 3.0,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a5',
                orientation: 'portrait'
            }
        };

        const worker = html2pdf().set(opt).from(element);
        await worker.save();

        // স্ক্রল আগের পজিশনে ফিরিয়ে আনা হলো
        window.scrollTo(0, currentScrollY);
        closeCustomPopup();
        showCustomPopup("✅", "পিডিএফ ডাউনলোড সম্পন্ন হয়েছে!", true);

    } catch (error) {
        console.error("PDF download error:", error);
        window.scrollTo(0, currentScrollY);
        closeCustomPopup();
        showCustomPopup("❌", "ডাউনলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", true);
    }
}
async function shareReceipt() {
    const preparerName = document.getElementById('receiptPreparedBy').value.trim();
    if (!preparerName) {
        showCustomPopup("⚠️", "দয়া করে রশিদের নিচে 'প্রস্তুতকারক' এর নাম লিখুন।", true);
        return;
    }

    const element = document.getElementById('printReceiptArea');
    if (!element) return;

    let name = 'রশিদ';
    let memberId = '';
    const isMemberVisible = document.getElementById('memberReceiptView').style.display !== 'none';
    if (isMemberVisible) {
        name = document.getElementById('rName').innerText.trim() || 'সদস্য';
        memberId = document.getElementById('rId').innerText.trim() || '';
    } else {
        name = document.getElementById('donRName').innerText.trim() || 'দাতা';
    }

    const englishName = transliterateBengaliToEnglish(name);
    const cleanName = englishName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__+/g, '_');
    const cleanMemberId = memberId.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__+/g, '_');
    const receiptNo = document.getElementById('rNo').innerText || 'AF-REC';

    const pdfFileName = (isMemberVisible && cleanMemberId)
        ? `${cleanName}_${cleanMemberId}.pdf`
        : `${cleanName}.pdf`;

    showCustomPopup("⏳", "পিডিএফ তৈরি হচ্ছে...", false);

    // বর্তমান স্ক্রল পজিশন সংরক্ষণ করে স্ক্রিনকে ওপরে স্ক্রল করা হলো
    const currentScrollY = window.scrollY;
    window.scrollTo(0, 0);

    try {
        await new Promise(resolve => setTimeout(resolve, 250));

        const opt = {
            margin: [15, 10, 15, 10], // এ৫ পেজে নিখুঁত সেন্টারিং মার্জিন
            filename: pdfFileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 3.0,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a5',
                orientation: 'portrait'
            }
        };

        if (navigator.share) {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
            const file = new File([pdfBlob], pdfFileName, { type: "application/pdf" });

            window.scrollTo(0, currentScrollY);
            closeCustomPopup();

            await navigator.share({
                files: [file],
                title: `${name} এর রশিদ`,
                text: `আবাবিল ফাউন্ডেশন - রশিদ নং: ${receiptNo}`
            });
            showCustomPopup("✅", "শেয়ারিং সম্পন্ন হয়েছে!", true);
        } else {
            window.scrollTo(0, currentScrollY);
            closeCustomPopup();
            showCustomPopup("ℹ️", "আপনার ব্রাউজারে সরাসরি শেয়ার করার সুবিধা নেই। রশিদটি ডাউনলোড করে শেয়ার করতে পারেন।", true);
        }
    } catch (error) {
        console.error("Sharing failed:", error);
        window.scrollTo(0, currentScrollY);
        closeCustomPopup();
        showCustomPopup("❌", "শেয়ার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।", true);
    }
}

// ==================================================
// 🔒 পাসওয়ার্ড প্রোটেকশন ও রিসেট কোড লজিক এরিয়া
// ==================================================
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}



















































































































































































































function renderExpenseTable() {
    // ব্যয়ের টেবিল রেন্ডার করার পূর্বে সাজানো নিশ্চিত করা
    sortAllDataDescending();

    const publicTbody = document.getElementById('expenseTableBody');
    let publicHtml = '';
    let totalExpense = 0;

    if (expenseEntries.length === 0) {
        publicHtml = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); font-style:italic;">বর্তমানে কোনো ব্যয়ের বিবরণী নেই।</td></tr>`;
    } else {
        expenseEntries.forEach(entry => {
            totalExpense += entry.amount;
            const approvedByVal = entry.approvedby || "---";
            publicHtml += `<tr>
                <td data-label="তারিখ">${entry.date}</td>
                <td data-label="খাত">${entry.sector}</td>
                <td data-label="অনুমোদনকারী">${approvedByVal}</td>
                <td data-label="পরিমাণ" style="font-weight:bold; color:var(--primary);">${entry.amount}/-</td>
                <td data-label="অবস্থা"><span class="badge badge-warning">অনুমোদিত</span></td>
            </tr>`;
        });
    }
    if (publicTbody) publicTbody.innerHTML = publicHtml;

    const totalExpEl = document.getElementById('totalExpenseAmount');
    if (totalExpEl) totalExpEl.innerText = totalExpense.toLocaleString('bn-BD') + '/-';





























}

let selectedExpenseIndex = null;
























































































































































































































































































window.handleDirectRegistration = handleDirectRegistration;




function generateReceipt() {
    const select = document.getElementById('receiptMemberSelect');
    if (!select) return;

    const memberId = select.value;
    const memberView = document.getElementById('memberReceiptView');
    const donationView = document.getElementById('donationReceiptView');

    if (!memberId) {
        if (memberView) memberView.style.display = 'block';
        if (donationView) donationView.style.display = 'none';

        document.getElementById('rNo').innerText = '--';
        document.getElementById('rDate').innerText = '--';
        document.getElementById('rId').innerText = '--';
        document.getElementById('rName').innerText = '--';
        document.getElementById('rTarget').innerText = '--';
        document.getElementById('rAmount').innerText = '--';
        document.getElementById('rMonths').innerText = '--';
        document.getElementById('rDue').innerText = '--';
        return;
    }

    const member = membersData.find(m => m.id === memberId);
    if (member) {
        if (memberView) memberView.style.display = 'block';
        if (donationView) donationView.style.display = 'none';

        document.getElementById('rNo').innerText = member.latestReceiptNo || 'AF-REC-1000';

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const formattedDate = dd + '/' + mm + '/' + yyyy;

        document.getElementById('rDate').innerText = formattedDate;
        document.getElementById('rId').innerText = member.id;
        document.getElementById('rName').innerText = member.name;

        const targetDisplay = (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") ? member.type : member.fixedTarget + '/-';
        document.getElementById('rTarget').innerText = targetDisplay;
        document.getElementById('rAmount').innerText = (member.lastPaid || 0) + '/-';

        let monthsDisplay = '--';
        if (Array.isArray(member.lastPaidMonths) && member.lastPaidMonths.length > 0) {
            monthsDisplay = member.lastPaidMonths.join(', ');
        } else if (typeof member.lastPaidMonths === 'string' && member.lastPaidMonths.trim() !== '') {
            try {
                let parsed = JSON.parse(member.lastPaidMonths);
                if (Array.isArray(parsed)) {
                    monthsDisplay = parsed.join(', ');
                } else {
                    monthsDisplay = member.lastPaidMonths;
                }
            } catch (e) {
                monthsDisplay = member.lastPaidMonths;
            }
        }
        document.getElementById('rMonths').innerText = monthsDisplay;

        const dueDisplay = (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") ? '০/-' : (member.totalDue || 0) + '/-';
        document.getElementById('rDue').innerText = dueDisplay;
    }
}

// ==================================================
// 💰 সাধারণ আয়ের এন্ট্রি হ্যান্ডলিং ফাংশনসমূহ
// ==================================================




















































































































































































































































function liveSearchMemberDetails() {
    let input = document.getElementById('memberDetailsSearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('memberDetailsTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i += 2) {
        let mainRow = rows[i];
        let detailRow = rows[i + 1];
        if (!mainRow || !detailRow) continue;

        let idText = (mainRow.cells[0]?.textContent || "").toLowerCase();
        let nameText = (mainRow.cells[1]?.textContent || "").toLowerCase();
        let detailText = (detailRow.textContent || "").toLowerCase();

        if (idText.includes(input) || nameText.includes(input) || detailText.includes(input)) {
            mainRow.style.display = "";
            let icon = document.getElementById('toggle-icon-' + idText.trim().toUpperCase());
            let isOpen = icon && icon.innerText === '▲';
            detailRow.style.display = isOpen ? ((window.innerWidth <= 768) ? 'block' : 'table-row') : 'none';
        } else {
            mainRow.style.display = "none";
            detailRow.style.display = "none";
        }
    }
}













































































function triggerHomeAnimations() {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    if (!reveals.length) return;

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, observerOptions);

    reveals.forEach(el => {
        observer.observe(el);
    });
}

window.triggerHomeAnimations = triggerHomeAnimations;

// ১. প্রজেক্ট রিপোর্ট উইন্ডোর ড্রপডাউনে ইউনিক প্রজেক্ট লোড করা


































































































































































































































































function sortAllDataDescending() {
    // ১. সদস্যদের আইডি ক্রমানুসারে বড় থেকে ছোট সাজানো
    if (Array.isArray(membersData)) {
        membersData.sort((a, b) => {
            let numA = parseInt(a.id.replace(/[^0-9]/g, '')) || 0;
            let numB = parseInt(b.id.replace(/[^0-9]/g, '')) || 0;
            return numB - numA;
        });
    }

    // ২. আয়ের রশিদ ক্রমানুসারে বড় থেকে ছোট সাজানো
    if (Array.isArray(donationEntries)) {
        donationEntries.sort((a, b) => {
            let numA = parseInt(a.receiptNo.replace(/[^0-9]/g, '')) || 0;
            let numB = parseInt(b.receiptNo.replace(/[^0-9]/g, '')) || 0;
            return numB - numA;
        });
    }

    // ৩. ব্যয়ের ভাউচার ক্রমানুসারে বড় থেকে ছোট সাজানো
    if (Array.isArray(expenseEntries)) {
        expenseEntries.sort((a, b) => {
            let voucherA = a.voucherno || a.voucher_no || a.voucherNo || "";
            let voucherB = b.voucherno || b.voucher_no || b.voucherNo || "";
            let numA = parseInt(voucherA.replace(/[^0-9]/g, '')) || 0;
            let numB = parseInt(voucherB.replace(/[^0-9]/g, '')) || 0;
            return numB - numA;
        });
    }
}

// সরাসরি কার্ড থেকে রক্তদানের তারিখ আপডেট করার হ্যান্ডলার ফাংশন
async function updateDonorDonationDateDirect(memberId) {
    const inputEl = document.getElementById(`direct-date-${memberId}`);
    if (!inputEl) return;

    const newDate = inputEl.value;
    if (!newDate) {
        showCustomPopup("⚠️", "অনুগ্রহ করে একটি সঠিক তারিখ নির্বাচন করুন।", true);
        return;
    }

    const donor = membersData.find(m => m.id === memberId);
    if (!donor) return;

    // মোট রক্তদানের সংখ্যা স্বয়ংক্রিয়ভাবে ১ বৃদ্ধি করা হচ্ছে
    const currentCount = parseInt(donor.donation_count) || 0;
    const newCount = currentCount + 1;

    showCustomPopup("⏳", "ডাটাবেজে রক্তদানের তথ্য আপডেট করা হচ্ছে...", false);

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({
                last_donation_date: newDate,
                donation_count: newCount
            })
            .eq('id', memberId);

        if (error) throw error;

        // লোকাল মেমোরি ডাটা আপডেট
        donor.last_donation_date = newDate;
        donor.donation_count = newCount;

        closeCustomPopup();
        showCustomPopup("✅", `${donor.name} এর রক্তদানের তথ্য সফলভাবে আপডেট করা হয়েছে।`, true);

        // সমস্ত পরিবর্তন এবং UI রিফ্রেশ
        refreshAllData();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: ডাটা আপডেট করা সম্ভব হয়নি।", true);
        console.error(err);
    }
}

// পপআপ মোডাল পরিচালনার গ্লোবাল ভেরিয়েবল
let quickDonationMemberId = null;

// মোডাল ওপেন করার ফাংশন
function openQuickDonationModal(memberId) {
    quickDonationMemberId = memberId;
    const donor = membersData.find(m => m.id === memberId);

    if (donor) {
        document.getElementById('quickDonationDonorName').innerText = `রক্তদাতা: ${donor.name} (${donor.blood})`;

        // ডিফল্টভাবে ইনপুটে আজকের তারিখ DD/MM/YYYY ফরম্যাটে সেট করা
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();
        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        document.getElementById('quickDonationDateInput').value = `${dd}/${mm}/${yyyy}`;
        document.getElementById('quickDonationIncrementCount').checked = true;

        // মোডাল শো করা
        document.getElementById('quickDonationModal').style.display = 'flex';
    }
}

// মোডাল বন্ধ করার ফাংশন
function closeQuickDonationModal() {
    document.getElementById('quickDonationModal').style.display = 'none';
    document.getElementById('quickDonationForm').reset();
    quickDonationMemberId = null;
}

// মোডালের বাইরে ক্লিক করলে বন্ধ হওয়ার লজিক
function closeQuickDonationModalOutside(event) {
    if (event.target.id === 'quickDonationModal') {
        closeQuickDonationModal();
    }
}

async function saveQuickDonationDate(event) {
    event.preventDefault();
    if (!quickDonationMemberId) return;

    // ৩টি ভিন্ন ইনপুট থেকে দিন, মাস ও বছর সংগ্রহ করা হচ্ছে (সদস্য ফরমের জন্মতারিখের মতো হুবহু একই পদ্ধতি)
    const day = document.getElementById('quickDonationDay').value.padStart(2, '0');
    const month = document.getElementById('quickDonationMonth').value.padStart(2, '0');
    const year = document.getElementById('quickDonationYear').value;

    // ভ্যালিডেশন চেক
    if (day === "00" || month === "00" || year.length < 4 || isNaN(day) || isNaN(month) || isNaN(year)) {
        showCustomPopup("⚠️", "অনুগ্রহ করে সঠিক দিন, মাস এবং বছর টাইপ করুন।", true);
        return;
    }

    // ডাটাবেজ ফরম্যাটের (YYYY-MM-DD) সাথে সামঞ্জস্য রেখে তারিখ তৈরি করা হলো (যেমনটি সদস্য ফরমে করা হয়)
    const dbFormattedDate = `${year}-${month}-${day}`;
    const isIncrementNeeded = document.getElementById('quickDonationIncrementCount').checked;

    const donor = membersData.find(m => m.id === quickDonationMemberId);
    if (!donor) return;

    let newCount = parseInt(donor.donation_count) || 0;
    if (isIncrementNeeded) {
        newCount += 1;
    }

    showCustomPopup("⏳", "রক্তদানের তারিখ আপডেট করা হচ্ছে...", false);

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({
                last_donation_date: dbFormattedDate,
                donation_count: newCount
            })
            .eq('id', quickDonationMemberId);

        if (error) throw error;

        // লোকাল মেমোরি ডাটা পরিবর্তন
        donor.last_donation_date = dbFormattedDate;
        donor.donation_count = newCount;

        closeQuickDonationModal();
        closeCustomPopup();
        showCustomPopup("✅", `${donor.name} এর রক্তদানের তথ্য সফলভাবে আপডেট করা হয়েছে।`, true);

        refreshAllData(); // ব্লাড ব্যাংক রিফ্রেশ
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: তথ্য সংরক্ষণ সম্ভব হয়নি। " + err.message, true);
        console.error(err);
    }
}
async function saveQuickDonationDate(event) {
    event.preventDefault();
    if (!quickDonationMemberId) return;

    // ৩টি ভিন্ন ইনপুট থেকে দিন, মাস ও বছর সংগ্রহ করা হচ্ছে (সদস্য ফরমের জন্মতারিখের মতো হুবহু একই পদ্ধতি)
    const day = document.getElementById('quickDonationDay').value.padStart(2, '0');
    const month = document.getElementById('quickDonationMonth').value.padStart(2, '0');
    const year = document.getElementById('quickDonationYear').value;

    // ভ্যালিডেশন চেক
    if (day === "00" || month === "00" || year.length < 4 || isNaN(day) || isNaN(month) || isNaN(year)) {
        showCustomPopup("⚠️", "অনুগ্রহ করে সঠিক দিন, মাস এবং বছর টাইপ করুন।", true);
        return;
    }

    // ডাটাবেজ ফরম্যাটের (YYYY-MM-DD) সাথে সামঞ্জস্য রেখে তারিখ তৈরি করা হলো (যেমনটি সদস্য ফরমে করা হয়)
    const dbFormattedDate = `${year}-${month}-${day}`;
    const isIncrementNeeded = document.getElementById('quickDonationIncrementCount').checked;

    const donor = membersData.find(m => m.id === quickDonationMemberId);
    if (!donor) return;

    let newCount = parseInt(donor.donation_count) || 0;
    if (isIncrementNeeded) {
        newCount += 1;
    }

    showCustomPopup("⏳", "রক্তদানের তারিখ আপডেট করা হচ্ছে...", false);

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({
                last_donation_date: dbFormattedDate,
                donation_count: newCount
            })
            .eq('id', quickDonationMemberId);

        if (error) throw error;

        // লোকাল মেমোরি ডাটা পরিবর্তন
        donor.last_donation_date = dbFormattedDate;
        donor.donation_count = newCount;

        closeQuickDonationModal();
        closeCustomPopup();
        showCustomPopup("✅", `${donor.name} এর রক্তদানের তথ্য সফলভাবে আপডেট করা হয়েছে।`, true);

        refreshAllData(); // ব্লাড ব্যাংক রিফ্রেশ
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: তথ্য সংরক্ষণ সম্ভব হয়নি। " + err.message, true);
        console.error(err);
    }
}

// নিরাপদ ও ক্রস-ব্রাউজার ডেট পার্সার (ক্রোম, সাফারি ও মোবাইল ব্রাউজার ফ্রেন্ডলি)
function parseLocalDate(dateStr) {
    if (!dateStr) return null;

    // YYYY-MM-DD ফরম্যাট চেক ও পার্সিং
    let parts = dateStr.split('-');
    if (parts.length === 3) {
        let y = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10) - 1; // মাস ০ থেকে শুরু হয়
        let d = parseInt(parts[2], 10);
        let date = new Date(y, m, d);
        if (!isNaN(date.getTime())) return date;
    }

    // DD/MM/YYYY ফরম্যাট চেক ও পার্সিং
    let partsSlash = dateStr.split('/');
    if (partsSlash.length === 3) {
        let d = parseInt(partsSlash[0], 10);
        let m = parseInt(partsSlash[1], 10) - 1;
        let y = parseInt(partsSlash[2], 10);
        let date = new Date(y, m, d);
        if (!isNaN(date.getTime())) return date;
    }

    // সাধারণ ফলব্যাক
    let date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}
/// এক ঘর থেকে অন্য ঘরে অটোমেটিক যাওয়ার নিরাপদ ও গ্লোবাল ফাংশন
function autoTabDate(current, nextId) {
    // ইনপুট বক্সের সর্বোচ্চ ক্যারেক্টার লিমিট (maxlength) রিড করা
    var maxLength = parseInt(current.getAttribute("maxlength"));
    if (current.value.length >= maxLength) {
        var nextEl = document.getElementById(nextId);
        if (nextEl) {
            nextEl.focus(); // পরবর্তী বক্সে ফোকাস নিয়ে যাওয়া
        }
    }
}

// এইচটিএমএল যাতে যেকোনো ব্রাউজারে এটি খুঁজে পায় তার জন্য গ্লোবাল স্কোপে যুক্ত করা হলো
window.autoTabDate = autoTabDate;


function openQuickDonationModal(memberId) {
    quickDonationMemberId = memberId;
    const donor = membersData.find(m => m.id === memberId);

    if (donor) {
        document.getElementById('quickDonationDonorName').innerText = `রক্তদাতা: ${donor.name} (${donor.blood})`;

        // ডিফল্ট কোনো তারিখ লেখা থাকবে না, ৩টি ইনপুটই খালি করা হলো
        document.getElementById('quickDonationDay').value = "";
        document.getElementById('quickDonationMonth').value = "";
        document.getElementById('quickDonationYear').value = "";

        document.getElementById('quickDonationIncrementCount').checked = true;
        document.getElementById('quickDonationModal').style.display = 'flex';
    }
}
async function saveQuickDonationDate(event) {
    event.preventDefault();
    if (!quickDonationMemberId) return;

    const day = document.getElementById('quickDonationDay').value.padStart(2, '0');
    const month = document.getElementById('quickDonationMonth').value.padStart(2, '0');
    const year = document.getElementById('quickDonationYear').value;

    // ভ্যালিডেশন চেক
    if (day === "00" || month === "00" || year.length < 4 || isNaN(day) || isNaN(month) || isNaN(year)) {
        showCustomPopup("⚠️", "অনুগ্রহ করে সঠিক দিন, মাস এবং বছর টাইপ করুন।", true);
        return;
    }

    const dbFormattedDate = `${year}-${month}-${day}`;
    const isIncrementNeeded = document.getElementById('quickDonationIncrementCount').checked;

    const donor = membersData.find(m => m.id === quickDonationMemberId);
    if (!donor) return;

    let newCount = parseInt(donor.donation_count) || 0;
    if (isIncrementNeeded) {
        newCount += 1;
    }

    showCustomPopup("⏳", "রক্তদানের তারিখ আপডেট করা হচ্ছে...", false);

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({
                last_donation_date: dbFormattedDate,
                donation_count: newCount
            })
            .eq('id', quickDonationMemberId);

        if (error) throw error;

        donor.last_donation_date = dbFormattedDate;
        donor.donation_count = newCount;

        closeQuickDonationModal();
        closeCustomPopup();
        showCustomPopup("✅", `${donor.name} এর রক্তদানের তথ্য সফলভাবে আপডেট করা হয়েছে।`, true);

        refreshAllData();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: তথ্য সংরক্ষণ সম্ভব হয়নি। " + err.message, true);
        console.error(err);
    }
}
// এক ঘর থেকে অন্য ঘরে অটোমেটিক যাওয়ার নিরাপদ ও গ্লোবাল ফাংশন
function autoTabDate(current, nextId) {
    var maxLength = parseInt(current.getAttribute("maxlength"));
    if (current.value.length >= maxLength) {
        var nextEl = document.getElementById(nextId);
        if (nextEl) {
            nextEl.focus();
        }
    }
}
window.autoTabDate = autoTabDate;

// রক্তদানের তারিখ দ্রুত আপডেট মোডাল ওপেন
function openQuickDonationModal(memberId) {
    quickDonationMemberId = memberId;
    const donor = membersData.find(m => m.id === memberId);

    if (donor) {
        document.getElementById('quickDonationDonorName').innerText = `রক্তদাতা: ${donor.name} (${donor.blood})`;

        // ডিফল্ট কোনো তারিখ লেখা থাকবে না, ৩টি ইনপুটই খালি করা হলো
        document.getElementById('quickDonationDay').value = "";
        document.getElementById('quickDonationMonth').value = "";
        document.getElementById('quickDonationYear').value = "";

        document.getElementById('quickDonationIncrementCount').checked = true;
        document.getElementById('quickDonationModal').style.display = 'flex';
    }
}

// রক্তদানের তারিখ দ্রুত আপডেট সংরক্ষণ
async function saveQuickDonationDate(event) {
    event.preventDefault();
    if (!quickDonationMemberId) return;

    const day = document.getElementById('quickDonationDay').value.padStart(2, '0');
    const month = document.getElementById('quickDonationMonth').value.padStart(2, '0');
    const year = document.getElementById('quickDonationYear').value;

    // ভ্যালিডেশন চেক
    if (day === "00" || month === "00" || year.length < 4 || isNaN(day) || isNaN(month) || isNaN(year)) {
        showCustomPopup("⚠️", "অনুগ্রহ করে সঠিক দিন, মাস এবং বছর টাইপ করুন।", true);
        return;
    }

    const dbFormattedDate = `${year}-${month}-${day}`;
    const isIncrementNeeded = document.getElementById('quickDonationIncrementCount').checked;

    const donor = membersData.find(m => m.id === quickDonationMemberId);
    if (!donor) return;

    let newCount = parseInt(donor.donation_count) || 0;
    if (isIncrementNeeded) {
        newCount += 1;
    }

    showCustomPopup("⏳", "রক্তদানের তারিখ আপডেট করা হচ্ছে...", false);

    try {
        const { error } = await supabaseClient
            .from('members')
            .update({
                last_donation_date: dbFormattedDate,
                donation_count: newCount
            })
            .eq('id', quickDonationMemberId);

        if (error) throw error;

        donor.last_donation_date = dbFormattedDate;
        donor.donation_count = newCount;

        closeQuickDonationModal();
        closeCustomPopup();
        showCustomPopup("✅", `${donor.name} এর রক্তদানের তথ্য সফলভাবে আপডেট করা হয়েছে।`, true);

        refreshAllData();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: তথ্য সংরক্ষণ সম্ভব হয়নি। " + err.message, true);
        console.error(err);
    }
}

// রক্তদাতা তথ্য সংশোধন মোডাল ওপেন করার ফাংশন
function editBloodDonor(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (member) {
        document.getElementById('editDonorId').value = member.id;
        document.getElementById('editDonorName').value = member.name;
        document.getElementById('editDonorAddress').value = member.address || member.permAddress || '';
        document.getElementById('editDonorBloodGroup').value = member.blood || 'O+';
        document.getElementById('editDonorPhone').value = member.phone;

        // ডাটাবেজের YYYY-MM-DD বা DD/MM/YYYY ফরম্যাট থেকে ৩টি বক্সে ভাগ করে এডিট মোডালে প্রদর্শন করা
        let d = "", m = "", y = "";
        if (member.last_donation_date) {
            const parsedDate = parseLocalDate(member.last_donation_date);
            if (parsedDate) {
                d = String(parsedDate.getDate()).padStart(2, '0');
                m = String(parsedDate.getMonth() + 1).padStart(2, '0');
                y = String(parsedDate.getFullYear());
            }
        }
        document.getElementById('editDonorLastDonationDay').value = d;
        document.getElementById('editDonorLastDonationMonth').value = m;
        document.getElementById('editDonorLastDonationYear').value = y;

        document.getElementById('editDonorDonationCount').value = member.donation_count || 0;
        document.getElementById('editBloodDonorModal').style.display = 'flex';
    }
}

// রক্তদাতার সংশোধিত তথ্য সংরক্ষণ
async function saveEditedBloodDonor(event) {
    event.preventDefault();
    const id = document.getElementById('editDonorId').value;
    const member = membersData.find(m => m.id === id);
    if (member) {
        member.name = document.getElementById('editDonorName').value;
        member.address = document.getElementById('editDonorAddress').value;
        member.blood = document.getElementById('editDonorBloodGroup').value;
        member.phone = document.getElementById('editDonorPhone').value;

        // ৩টি ভিন্ন ইনপুট থেকে দিন, মাস ও বছর সংগ্রহ করে ডাটাবেজ বান্ধব YYYY-MM-DD ফরম্যাটে রূপান্তর করা
        const day = document.getElementById('editDonorLastDonationDay').value.trim().padStart(2, '0');
        const month = document.getElementById('editDonorLastDonationMonth').value.trim().padStart(2, '0');
        const year = document.getElementById('editDonorLastDonationYear').value.trim();

        let dbEditDate = null;
        if (day && month && year && day !== "00" && month !== "00" && year.length === 4) {
            dbEditDate = `${year}-${month}-${day}`;
        }

        member.last_donation_date = dbEditDate;
        member.donation_count = parseInt(document.getElementById('editDonorDonationCount').value) || 0;

        showCustomPopup("⏳", "রক্তদাতার তথ্য আপডেট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .update({
                    name: member.name,
                    address: member.address,
                    blood: member.blood,
                    phone: member.phone,
                    last_donation_date: member.last_donation_date,
                    donation_count: member.donation_count
                })
                .eq('id', id);
            if (error) throw error;

            closeEditBloodDonorModal();
            closeCustomPopup();
            showCustomPopup("✅", 'রক্তদাতার তথ্য সফলভাবে সংশোধন করা হয়েছে!', true);
            refreshAllData();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: তথ্য সংরক্ষণ করা সম্ভব হয়নি।", true);
        }
    }
}
// লাইভ নোটিশ ডাটাবেজে সংরক্ষণ করা




































function animateBengaliCounter(elementId, actualValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    // ১০, ৫০ এর ডাইনামিক রাউন্ড লজিক দিয়ে টার্গেট সংখ্যা নির্ধারণ
    let targetNum;
    let suffix = "+";
    
    if (actualValue < 10) {
        targetNum = actualValue;
        suffix = ""; // ১০ এর কম হলে প্লাস চিহ্ন থাকবে না
    } else if (actualValue >= 10 && actualValue <= 20) {
        targetNum = 10;
    } else if (actualValue > 100) {
        targetNum = Math.floor((actualValue - 1) / 50) * 50;
    } else {
        targetNum = Math.floor((actualValue - 1) / 10) * 10;
    }

    let current = 0;
    const duration = 1500; // ১.৫ সেকেন্ডে অ্যানিমেশন সম্পন্ন হবে
    const steps = 50; // অ্যানিমেশন ফ্রেম রেট
    const stepValue = targetNum / steps;
    const stepTime = duration / steps;

    // পূর্বে রানিং থাকা টাইমার বন্ধ করা
    if (element.counterInterval) clearInterval(element.counterInterval);

    element.counterInterval = setInterval(() => {
        current += stepValue;
        if (current >= targetNum) {
            current = targetNum;
            clearInterval(element.counterInterval);
        }
        // বাংলা সংখ্যায় রূপান্তর করে বসানো হচ্ছে
        element.innerText = translateToBengaliNumber(Math.floor(current)) + suffix;
    }, stepTime);
}

// ২. ডাটাবেজ লোড হওয়ার সাথে সাথে অ্যানিমেশন ট্রিগার করার মেইন ফাংশন
function updateDynamicStats() {
    // ক. মোট সক্রিয় সদস্য সংখ্যা বের করা
    const totalMembers = membersData.filter(m => m.type !== "রক্তদাতা").length;

    // খ. নিবন্ধিত রক্তদাতার সংখ্যা বের করা
    const totalDonors = membersData.filter(m => m.blood && m.blood !== '---' && m.blood.trim() !== "").length;

    // গ. সফল রক্তদানের সর্বমোট সংখ্যা (সকল মেম্বারদের 'donation_count' যোগফল)
    const totalDonations = membersData.reduce((sum, m) => sum + (parseInt(m.donation_count) || 0), 0);

    // ঘ. ৩টি কলামে বাংলা কাউন্টার অ্যানিমেশন চালু করা
    animateBengaliCounter('statTotalMembers', totalMembers);
    animateBengaliCounter('statTotalDonors', totalDonors);
    animateBengaliCounter('statTotalDonations', totalDonations);
}
