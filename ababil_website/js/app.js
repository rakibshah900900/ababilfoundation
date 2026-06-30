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
    'executiveSection': 'কার্যনির্বাহী পরিষদ',
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
    sessionStorage.removeItem('exec_authenticated');

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
    renderTargetTable();
    renderBloodTable();
    renderMemberDetailsTable();
    renderPublicMemberList();
    renderDonationTable();
    renderExpenseTable();
    populateReceiptDropdown();
    updateTargetSummary();

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

function deleteMember(memberId) {
    memberToDelete = memberId;
    showConfirmModal(`আপনি কি নিশ্চিত যে সদস্য আইডি: ${memberId} এর সমস্ত তথ্য ডিলিট করতে চান?`, function () {
        executeDeleteMember();
    });
}

async function executeDeleteMember() {
    if (memberToDelete) {
        showCustomPopup("⏳", "ডাটাবেজ থেকে সদস্য ডিলিট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .delete()
                .eq('id', memberToDelete);
            if (error) throw error;

            membersData = membersData.filter(m => m.id !== memberToDelete);
            closeDeleteModal();
            closeCustomPopup();
            refreshAllData();

            showCustomPopup("✅", `সদস্য আইডি: ${memberToDelete} মুছে ফেলা হয়েছে।`, true);
            memberToDelete = null;
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: সদস্য মুছে ফেলা সম্ভব হয়নি।", true);
        }
    }
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
    memberToDelete = null;
}

async function deleteDonationEntry(index) {
    const entry = donationEntries[index];
    const receiptNo = entry.receiptNo;

    showConfirmModal(`আপনি কি নিশ্চিত যে এই রেকর্ডটি (${receiptNo}) মুছে ফেলতে চান?`, async function () {
        showCustomPopup("⏳", "ডাটাবেজ থেকে তথ্য ডিলিট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('donations')
                .delete()
                .eq('receiptNo', receiptNo);
            if (error) throw error;

            donationEntries.splice(index, 1);
            delete donationReceiptsStatus[receiptNo];
            closeCustomPopup();
            showCustomPopup("✅", 'রেকর্ডটি মুছে ফেলা হয়েছে।', true);
            renderDonationTable();
            updateIncomeStatistics('1m');
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: তথ্য মোছা যায়নি।", true);
        }
    });
}

function editMember(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (member) {
        document.getElementById('editMemberId').value = member.id;
        document.getElementById('editMemberName').value = member.name;
        document.getElementById('editMemberFixedTarget').value = member.fixedTarget || 0;
        document.getElementById('editMemberPhone').value = member.phone;
        document.getElementById('editMemberAddress').value = member.address;
        document.getElementById('editMemberProfession').value = member.profession || '';
        document.getElementById('editMemberBlood').value = member.blood;
        document.getElementById('editMemberDueDisplay').value = member.totalDue + ' টাকা';

        document.getElementById('editMemberModal').style.display = 'flex';
    }
}

function closeEditModal() {
    document.getElementById('editMemberModal').style.display = 'none';
}

function closeEditModalOutside(event) {
    if (event.target.id === 'editMemberModal') closeEditModal();
}

async function saveEditedMember(event) {
    event.preventDefault();
    const id = document.getElementById('editMemberId').value;
    const member = membersData.find(m => m.id === id);
    if (member) {
        member.name = document.getElementById('editMemberName').value;
        member.fixedTarget = parseInt(document.getElementById('editMemberFixedTarget').value) || 0;
        member.phone = document.getElementById('editMemberPhone').value;
        member.address = document.getElementById('editMemberAddress').value;
        member.profession = document.getElementById('editMemberProfession').value;
        member.blood = document.getElementById('editMemberBlood').value;

        calculateIndividualDue(member);

        showCustomPopup("⏳", "তথ্য আপডেট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .update({
                    name: member.name,
                    fixedTarget: member.fixedTarget,
                    phone: member.phone,
                    address: member.address,
                    profession: member.profession,
                    blood: member.blood
                })
                .eq('id', id);
            if (error) throw error;

            closeEditModal();
            closeCustomPopup();
            showCustomPopup("✅", 'তথ্য সফলভাবে সংশোধন করা হয়েছে!', true);
            refreshAllData();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: তথ্য সেভ করা সম্ভব হয়নি।", true);
        }
    }
}

function refreshAllData() {
    sortAllDataDescending();

    updateTargetSummary();
    renderTargetTable();
    renderBloodTable();
    renderMemberDetailsTable();
    renderPublicMemberList();
    updateIncomeStatistics('1m');
    renderDonationTable();
    renderGeneralIncomeTable();
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

function toggleTargetDetailsRow(id) {
    const detailsDiv = document.getElementById('target-details-row-' + id);
    const icon = document.getElementById('toggle-target-icon-' + id);
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

function switchExecutiveTab(tabId) {
    document.querySelectorAll('.executive-sub-content').forEach(content => {
        content.style.display = 'none';
    });

    document.getElementById('tabBtnTarget').classList.remove('active');
    document.getElementById('tabBtnDetails').classList.remove('active');
    document.getElementById('tabBtnIncomeEntry').classList.remove('active');
    document.getElementById('tabBtnExpenseEntry').classList.remove('active');
    document.getElementById('tabBtnProjectReport').classList.remove('active');
    document.getElementById('tabBtnLiveTicker').classList.remove('active'); // নতুন বাটন রিসেট

    if (tabId === 'targetSubSection') document.getElementById('tabBtnTarget').classList.add('active');
    if (tabId === 'memberDetailsSubSection') document.getElementById('tabBtnDetails').classList.add('active');
    if (tabId === 'incomeEntrySubSection') document.getElementById('tabBtnIncomeEntry').classList.add('active');
    if (tabId === 'expenseEntrySubSection') document.getElementById('tabBtnExpenseEntry').classList.add('active');
    if (tabId === 'projectReportSubSection') {
        document.getElementById('tabBtnProjectReport').classList.add('active');
        populateProjectReportDropdown();
    }
    if (tabId === 'liveTickerSubSection') document.getElementById('tabBtnLiveTicker').classList.add('active'); // নতুন বাটন অ্যাক্টিভেশন

    const targetSection = document.getElementById(tabId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
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

    let amount = 0;
    if (memberType === 'মাসিক ধার্যকৃত সদস্য') {
        amount = parseInt(document.getElementById('regMonthlyAmount').value) || 0;
    }
    const blood = document.getElementById('regBloodGroup').value;

    showCustomPopup("⏳", "আপনার তথ্য প্রক্রিয়াকরণ হচ্ছে, অনুগ্রহ করে ৩ সেকেন্ড অপেক্ষা করুন...", false);

    setTimeout(async () => {
        const id = 'AF-' + autoIdCounter;
        const newMember = {
            id: id, name: name, fatherName: father, motherName: mother, dob: dob,
            nationality: nationality, religion: religion, profession: profession,
            phone: phone, permAddress: permAddress, address: presAddress, type: memberType,
            fixedTarget: amount, blood: blood, lastPaid: 0, lastPaidAmount: 0, lastPaidMonths: [], paidMonths: [],
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

function openEntryModal() {
    document.getElementById('entryModal').style.display = 'flex';
    document.getElementById('autoMemberId').value = 'AF-' + autoIdCounter;
    document.getElementById('shortFormAmountGroup').style.display = 'flex';
}

function closeEntryModal() {
    document.getElementById('entryModal').style.display = 'none';
    document.getElementById('newMemberForm').reset();
}

function closeEntryModalOutside(event) {
    if (event.target.id === 'entryModal') closeEntryModal();
}

async function saveNewMember(event) {
    event.preventDefault();
    const id = document.getElementById('autoMemberId').value;
    const name = document.getElementById('newMemberName').value;
    const address = document.getElementById('newMemberAddress').value;
    const phone = document.getElementById('newMemberPhone').value;
    const memberType = document.getElementById('newMemberTypeSelect').value;

    let amount = 0;
    if (memberType === 'মাসিক ধার্যকৃত সদস্য') {
        amount = parseInt(document.getElementById('newMemberAmount').value) || 0;
    }
    const blood = document.getElementById('newMemberBlood').value;

    const newMember = {
        id: id, name: name, address: address, phone: phone, type: memberType, fixedTarget: amount, blood: blood,
        lastPaid: 0, lastPaidAmount: 0, lastPaidMonths: [], paidMonths: [], totalDue: 0, totalPaidAccumulated: 0, status: "", latestReceiptNo: "", receiptSent: false
    };

    calculateIndividualDue(newMember);

    showCustomPopup("⏳", "সদস্য তথ্য প্রসেস হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('members')
            .insert([newMember]);
        if (error) throw error;

        autoIdCounter++;

        await loadAllDataFromSupabase();

        closeEntryModal();
        closeCustomPopup();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: সদস্য সেভ হয়নি।", true);
    }
}
function openDonationModal() {
    document.getElementById('donationModal').style.display = 'flex';
    document.getElementById('donReceiptNo').value = 'AF-REC-' + globalReceiptCounter;


    // ডিফল্ট কোনো তারিখ লেখা থাকবে না, ৩টি ইনপুটই খালি রাখা হলো
    document.getElementById('quickDonationDay').value = "";
    document.getElementById('quickDonationMonth').value = "";
    document.getElementById('quickDonationYear').value = "";
}

function closeDonationModal() {
    document.getElementById('donationModal').style.display = 'none';
    document.getElementById('donationForm').reset();
}

function showSection(sectionId, isNavigating = false) {
    window.scrollTo(0, 0);

    const sections = ['homeView', 'regFormSection', 'memberListSection', 'incomeSection', 'expenseSection', 'executiveSection', 'bloodBankSection', 'receiptSection'];
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

    if (sectionId === 'executiveSection') {
        const isAuthenticated = sessionStorage.getItem('exec_authenticated') === 'true';
        if (isAuthenticated) {
            showExecutiveContent();
        } else {
            showExecutiveAuthPrompt();
        }
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
    if (sectionId === 'executiveSection' && mobNavItems[3]) mobNavItems[3].classList.add('active');

    updateNavigationButtons();
}

function closeDonationModalOutside(event) {
    if (event.target.id === 'donationModal') closeDonationModal();
}

async function saveDonationEntry(event) {
    event.preventDefault();
    const receiptNo = document.getElementById('donReceiptNo').value;
    const rawDate = document.getElementById('donDate').value;
    const name = document.getElementById('donName').value;
    const address = document.getElementById('donAddress').value;
    const phone = document.getElementById('donPhone').value;
    const amount = parseInt(document.getElementById('donAmount').value) || 0;
    const sector = document.getElementById('donSector').value;
    const project = document.getElementById('donProject').value;

    let dateParts = rawDate.split('-');
    let dateStr = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];

    const entry = {
        receiptNo: receiptNo, date: dateStr, name: name, address: address,
        phone: phone, amount: amount, sector: sector, project: project
    };

    showCustomPopup("⏳", "আয়ের খাত ডাটাবেজে যাচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('donations')
            .insert([entry]);
        if (error) throw error;

        donationReceiptsStatus[receiptNo] = false;
        localStorage.setItem('ababil_donation_receipt_status', JSON.stringify(donationReceiptsStatus));

        globalReceiptCounter++;

        await loadAllDataFromSupabase();

        closeDonationModal();
        closeCustomPopup();

        showCustomPopup("✅", "আয়ের খাত সফলভাবে এন্ট্রি হয়েছে।", true);
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: রেকর্ড সেভ করা যায়নি।", true);
    }
}

function generateDonationReceiptAction(receiptNo) {
    donationReceiptsStatus[receiptNo] = true;
    renderDonationTable();
    updateIncomeStatistics('1m');

    showCustomPopup("⏳", "রশিদ জেনারেট হচ্ছে...", false);
    setTimeout(() => {
        closeCustomPopup();
        showDirectDonationReceipt(receiptNo);
    }, 1000);
}

function showDirectDonationReceipt(receiptNo) {
    const entry = donationEntries.find(e => e.receiptNo === receiptNo);
    if (entry) {
        showSection('receiptSection');
        document.getElementById('receiptMemberSelect').value = "";

        document.getElementById('memberReceiptView').style.display = 'none';
        document.getElementById('donationReceiptView').style.display = 'block';

        document.getElementById('rNo').innerText = entry.receiptNo;
        document.getElementById('rDate').innerText = entry.date;
        document.getElementById('donRName').innerText = entry.name;
        document.getElementById('donRAddress').innerText = entry.address;
        document.getElementById('donRPhone').innerText = entry.phone || '---';
        document.getElementById('donRSector').innerText = entry.sector;
        document.getElementById('donRAmount').innerText = entry.amount + '/-';
    }
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

function liveSearchTargetMembers() {
    let value = document.getElementById('targetSearchInput').value.toLowerCase().trim();
    let table = document.getElementById('targetTableBody');
    let tr = table.getElementsByTagName('tr');

    for (let i = 0; i < tr.length; i++) {
        let idCell = tr[i].getElementsByTagName('td')[0];
        let nameCell = tr[i].getElementsByTagName('td')[1];

        if (idCell || nameCell) {
            let idText = (idCell.textContent || idCell.innerText).toLowerCase();
            let nameText = (nameCell.textContent || nameCell.innerText).toLowerCase();

            if (idText.indexOf(value) > -1 || nameText.indexOf(value) > -1) {
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

function updateTargetSummary() {
    let targetMembers = membersData.filter(m => m.type === 'মাসিক ধার্যকৃত সদস্য');
    let totalPaid = membersData.reduce((sum, m) => sum + (parseInt(m.totalPaidAccumulated) || 0), 0);
    let totalDue = targetMembers.reduce((sum, m) => sum + m.totalDue, 0);
    document.getElementById('tgtTotalPaid').innerText = totalPaid + '/-';
    document.getElementById('tgtTotalDue').innerText = totalDue + '/-';
    document.getElementById('tgtBtnAll').innerText = `সকল ধার্যকৃত সদস্য (${targetMembers.length})`;
}

function renderTargetTable(filter = 'all') {
    let html = '';
    let targetMembers = membersData.filter(m => m.type === 'মাসিক ধার্যকৃত সদস্য');

    if (targetMembers.length === 0) {
        html = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); font-style:italic;">বর্তমানে কোনো মাসিক ধার্যকৃত সদস্যের ডাটা নেই।</td></tr>`;
        document.getElementById('targetTableBody').innerHTML = html;
        return;
    }

    targetMembers.forEach(m => {
        if (filter === 'paid' && m.status !== 'বকেয়ামুক্ত') return;
        if (filter === 'due' && m.status !== 'বকেয়া') return;

        let badge = m.status === 'বকেয়া' ? 'badge-warning' : 'badge-success';
        let receiptStatusCell = m.receiptSent ?
            `<span class="receipt-status-sent" onclick="showMemberReceiptDirect('${m.id}')">রশিদ পাঠানো হয়েছে</span>` :
            `<span class="receipt-status-send" onclick="sendReceipt('${m.id}')">রশিদ পাঠানো হয়নি</span>`;

        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="সদস্য আইডি"><strong>${m.id}</strong></td>
            <td data-label="নাম"><span class="clickable-name" onclick="openMemberModal('${m.id}')">${m.name}</span></td>
            <td data-label="রশিদ">${receiptStatusCell}</td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-${m.id}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, '${m.id}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editMember('${m.id}')">Edit</button>
                            <button class="btn-delete" onclick="deleteMember('${m.id}')">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-target-icon-${m.id}" onclick="event.stopPropagation(); toggleTargetDetailsRow('${m.id}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="target-details-row-${m.id}" style="display: none; background-color: #f8fafc;">
            <td colspan="4" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 10px 14px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left; animation: fadeIn 0.4s ease-out; box-shadow: var(--shadow);">
                    <p style="margin: 2px 0;"><strong>👤 সদস্যের ধরন:</strong> ${m.type}</p>
                    <p style="margin: 2px 0;"><strong>💰 ধার্য (মাসিক):</strong> ${m.fixedTarget}/-</p>
                    <p style="margin: 2px 0;"><strong>📥 সর্বশেষ জমা:</strong> ${m.lastPaid}/-</p>
                    <p style="margin: 2px 0;"><strong>⚠️ বকেয়া:</strong> <span style="color:${m.totalDue > 0 ? 'var(--primary)' : 'var(--success)'}; font-weight:bold;">${m.totalDue}/-</span></p>
                    <p style="margin: 2px 0;"><strong>📌 অবস্থা:</strong> <span class="badge ${badge}">${m.status}</span></p>
                </div>
            </td>
        </tr>`;
    });
    document.getElementById('targetTableBody').innerHTML = html;
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

function filterMembers(type) {
    document.querySelectorAll('#executiveSection .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (type === 'all') document.getElementById('tgtBtnAll').classList.add('active');
    if (type === 'paid') document.getElementById('tgtBtnPaid').classList.add('active');
    if (type === 'due') document.getElementById('tgtBtnDue').classList.add('active');
    renderTargetTable(type);
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
        document.getElementById('profBlood').innerText = member.blood;
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
        card.onclick = function () { toggleMonthPaymentTemp(member.id, month); };
        container.appendChild(card);
    });
}

function toggleMonthPaymentTemp(memberId, monthName) {
    let member = membersData.find(m => m.id === memberId);
    if (member && member.type !== "স্থায়ী দাতা সদস্য" && member.type !== "সাধারণ সদস্য" && member.type !== "রক্তদাতা") {
        const monthIndex = tempPaidMonths.indexOf(monthName);
        if (monthIndex > -1) {
            tempPaidMonths.splice(monthIndex, 1);
        } else {
            tempPaidMonths.push(monthName);
        }

        updateModalTemporaryDues(member);
        renderMonthsGrid(member);
    }
}

async function saveMemberModalChanges() {
    let member = membersData.find(m => m.id === selectedMemberId);
    if (member) {
        if (member.type !== "স্থায়ী দাতা সদস্য" && member.type !== "সাধারণ সদস্য" && member.type !== "রক্তদাতা") {
            let newlyPaidMonths = tempPaidMonths.filter(m => !initialPaidMonths.includes(m));
            let paidAmount = newlyPaidMonths.length * member.fixedTarget;

            member.paidMonths = [...tempPaidMonths];
            member.lastPaidAmount = paidAmount;
            member.lastPaidMonths = [...newlyPaidMonths];
            member.lastPaid = paidAmount;

            if (paidAmount > 0) {
                member.receiptSent = false;
                member.latestReceiptNo = 'AF-REC-' + globalReceiptCounter++;
            }
        } else {
            member.lastPaidAmount = 0;
            member.lastPaidMonths = [];
        }

        calculateIndividualDue(member);

        showCustomPopup("⏳", "ডাটাবেজে আপডেট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .update(member)
                .eq('id', selectedMemberId);
            if (error) throw error;

            closeMemberModal();
            closeCustomPopup();
            refreshAllData();

            showCustomPopup("✅", "পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।", true);
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: পেমেন্ট তথ্য সংরক্ষণ করা যায়নি।", true);
        }
    }
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

function renderMemberDetailsTable() {
    const tbody = document.getElementById('memberDetailsTableBody');
    if (membersData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-style:italic;">নিবন্ধিত কোনো সদস্য পাওয়া যায়নি।</td></tr>`;
        return;
    }
    let html = '';
    membersData.forEach(m => {
        let father = m.fatherName ? m.fatherName : '---';
        let mother = m.motherName ? m.motherName : '---';
        let profession = m.profession ? m.profession : '---';
        let targetDisplay = (m.type === "স্থায়ী দাতা সদস্য" || m.type === "সাধারণ সদস্য" || m.type === "রক্তদাতা") ? m.type : m.fixedTarget + '/-';
        let fullAddress = m.address || '---';

        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="আইডি"><strong>${m.id}</strong></td>
            <td data-label="নাম"><span class="clickable-name" onclick="openMemberModal('${m.id}')">${m.name}</span></td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-details-${m.id}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'details-${m.id}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editMember('${m.id}')">Edit</button>
                            <button class="btn-delete" onclick="deleteMember('${m.id}')">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-icon-${m.id}" onclick="event.stopPropagation(); toggleMemberDetailsRow('${m.id}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="details-row-${m.id}" style="display: none; background-color: #f8fafc;">
            <td colspan="3" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left; animation: fadeIn 0.25s ease-out; box-shadow: var(--shadow);">
                    <p style="margin: 2px 0;"><strong>👨‍👦 পিতা/মাতা:</strong> পিতা: ${father} | মাতা: ${mother}</p>
                    <p style="margin: 2px 0;"><strong>📞 মোবাইল নম্বর:</strong> ${m.phone}</p>
                    <p style="margin: 2px 0;"><strong>💼 ধরন ও পেশা:</strong> <span style="font-weight:bold; color:var(--secondary);">${m.type}</span> (${profession})</p>
                    <p style="margin: 2px 0;"><strong>🩸 রক্ত ও ধার্য:</strong> Group: <span class="badge badge-blood" style="padding: 2px 6px; font-size: 10px;">${m.blood}</span> | ধার্য: ${targetDisplay}</p>
                    <p style="margin: 2px 0;"><strong>📍 ঠিকানা:</strong> ${truncateText(fullAddress, 25, 'ঠিকানা')}</p>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
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
        if (!m.blood || m.blood.trim() === "" || m.blood === "---") return;

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

function showExecutiveContent() {
    document.getElementById('executiveAuthContainer').style.display = 'none';
    document.getElementById('execContentWrapper').style.display = 'block';
}

function showExecutiveAuthPrompt() {
    document.getElementById('executiveAuthContainer').style.display = 'block';
    document.getElementById('execContentWrapper').style.display = 'none';
    showPasswordEntryView();
}

function showPasswordEntryView() {
    document.getElementById('passwordEntryView').style.display = 'block';
    document.getElementById('resetRequestView').style.display = 'none';
    document.getElementById('verifyCodeView').style.display = 'none';
    document.getElementById('newPasswordView').style.display = 'none';
}

function showResetPasswordView() {
    document.getElementById('passwordEntryView').style.display = 'none';
    document.getElementById('resetRequestView').style.display = 'block';
    document.getElementById('verifyCodeView').style.display = 'none';
    document.getElementById('newPasswordView').style.display = 'none';
}

function showVerifyCodeView() {
    document.getElementById('passwordEntryView').style.display = 'none';
    document.getElementById('resetRequestView').style.display = 'none';
    document.getElementById('verifyCodeView').style.display = 'block';
    document.getElementById('newPasswordView').style.display = 'none';
}

function showNewPasswordView() {
    document.getElementById('passwordEntryView').style.display = 'none';
    document.getElementById('resetRequestView').style.display = 'none';
    document.getElementById('verifyCodeView').style.display = 'none';
    document.getElementById('newPasswordView').style.display = 'block';
}

async function verifyExecPassword() {
    const enteredPassword = document.getElementById('execPasswordInput').value.trim();
    if (!enteredPassword) {
        showCustomPopup("⚠️", "দয়া করে পাসওয়ার্ড লিখুন।", true);
        return;
    }

    showCustomPopup("⏳", "পাসওয়ার্ড যাচাই করা হচ্ছে...", false);
    try {
        const { data, error } = await supabaseClient
            .from('admin_settings')
            .select('password')
            .eq('id', 'config')
            .single();

        if (error) throw error;

        if (data && data.password === enteredPassword) {
            closeCustomPopup();
            sessionStorage.setItem('exec_authenticated', 'true');
            showExecutiveContent();
        } else {
            closeCustomPopup();
            showCustomPopup("❌", "ভুল পাসওয়ার্ড! দয়া করে সঠিক পাসওয়ার্ড দিন।", true);
        }
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: পাসওয়ার্ড যাচাই ব্যর্থ হয়েছে।", true);
    }
}

async function sendResetCode() {
    const enteredEmail = document.getElementById('resetEmailInput').value.trim().toLowerCase();
    if (!enteredEmail) {
        showCustomPopup("⚠️", "দয়া করে জিমেইল এড্রেস লিখুন।", true);
        return;
    }

    showCustomPopup("⏳", "জিমেইল যাচাই করা হচ্ছে...", false);
    try {
        const { data, error } = await supabaseClient
            .from('admin_settings')
            .select('reset_email')
            .eq('id', 'config')
            .single();

        if (error) throw error;

        if (!data || data.reset_email.toLowerCase() !== enteredEmail) {
            closeCustomPopup();
            showCustomPopup("❌", "ভুল জিমেইল! এই জিমেইলটি পাসওয়ার্ড রিসেট করার জন্য অনুমোদিত নয়।", true);
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { error: updateError } = await supabaseClient
            .from('admin_settings')
            .update({
                reset_code: code,
                code_expires_at: expiresAt
            })
            .eq('id', 'config');

        if (updateError) throw updateError;

        showCustomPopup("⏳", "ভেরিফিকেশন কোড পাঠানো হচ্ছে...", false);

        const templateParams = {
            to_email: enteredEmail,
            reset_code: code,
            to_name: "Ababil Admin"
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function (response) {
                closeCustomPopup();
                showCustomPopup("📧", "আপনার জিমেইল এড্রেসে একটি ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।", true);
                showVerifyCodeView();
            }, function (err) {
                closeCustomPopup();
                showCustomPopup("❌", "কোড পাঠানো সম্ভব হয়নি।", true);
            });

    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: জিমেইল এড্রেস যাচাই করা যায়নি।", true);
    }
}

async function verifyResetCode() {
    const enteredCode = document.getElementById('otpCodeInput').value.trim();
    if (!enteredCode) {
        showCustomPopup("⚠️", "দয়া করে ভেরিফিকেশন কোড লিখুন।", true);
        return;
    }

    showCustomPopup("⏳", "কোড যাচাই করা হচ্ছে...", false);
    try {
        const { data, error } = await supabaseClient
            .from('admin_settings')
            .select('reset_code, code_expires_at')
            .eq('id', 'config')
            .single();

        if (error) throw error;

        if (!data || data.reset_code !== enteredCode) {
            closeCustomPopup();
            showCustomPopup("❌", "ভুল ভেরিফিকেশন কোড! পুনরায় চেষ্টা করুন।", true);
            return;
        }

        const expiresAt = new Date(data.code_expires_at);
        if (expiresAt < new Date()) {
            closeCustomPopup();
            showCustomPopup("⚠️", "ভেরিফিকেশন কোডের মেয়াদ শেষ হয়ে গেছে।", true);
            return;
        }

        closeCustomPopup();
        showCustomPopup("✅", "কোড সফলভাবে যাচাই করা হয়েছে!", true);
        showNewPasswordView();

    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: ভেরিফিকেশন কোড যাচাই করা সম্ভব হয়নি।", true);
    }
}

async function updateNewPassword() {
    const newPassword = document.getElementById('newPasswordInput').value.trim();
    const confirmNewPassword = document.getElementById('confirmNewPasswordInput').value.trim();

    if (!newPassword || !confirmNewPassword) {
        showCustomPopup("⚠️", "দয়া করে পাসওয়ার্ড লিখুন।", true);
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showCustomPopup("⚠️", "উভয় পাসওয়ার্ড হুবহু একই হতে হবে।", true);
        return;
    }

    showCustomPopup("⏳", "পাসওয়ার্ড আপডেট করা হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('admin_settings')
            .update({
                password: newPassword,
                reset_code: null,
                code_expires_at: null
            })
            .eq('id', 'config');

        if (error) throw error;

        closeCustomPopup();
        showCustomPopup("✅", "পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!", true);
        showPasswordEntryView();

    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: পাসওয়ার্ড আপডেট করা সম্ভব হয়নি।", true);
    }
}

// ==================================================
// 📉 ব্যয়ের খাত এন্ট্রি মেথড
// ==================================================
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

    const adminTbody = document.getElementById('executiveExpenseTableBody');
    let adminHtml = '';
    if (expenseEntries.length === 0) {
        adminHtml = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); font-style:italic;">বর্তমানে কোনো ব্যয়ের খাতের তথ্য যুক্ত করা হয়নি।</td></tr>`;
    } else {
        expenseEntries.forEach((entry, index) => {
            const voucherNoVal = entry.voucherno || "---";
            const approvedByVal = entry.approvedby || "---";
            adminHtml += `<tr>
                        <td data-label="ভাউচার নং"><span style="color:var(--primary); font-weight:bold;">${voucherNoVal}</span></td>
                        <td data-label="তারিখ">${entry.date}</td>
                        <td data-label="ব্যয়ের খাত"><strong>${entry.sector}</strong><br><small style="color:var(--text-muted); font-size:11px;">প্রজেক্ট: ${entry.project || '---'}</small></td>
                        <td data-label="অনুমোদনকারী">${approvedByVal}</td>
                <td data-label="পরিমাণ" style="font-weight:bold; color:var(--primary);">${entry.amount}/-</td>
                <td data-label="অবস্থা"><span class="badge badge-warning">অনুমোদিত</span></td>
                <td data-label="অ্যাকশন">
                    <div class="action-dropdown" id="dropdown-expense-${index}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'expense-${index}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editExpenseEntry(${index})">Edit</button>
                            <button class="btn-delete" onclick="deleteExpenseEntry(${index})">Delete</button>
                        </div>
                    </div>
                </td>
            </tr>`;
        });
    }
    if (adminTbody) adminHtml && (adminTbody.innerHTML = adminHtml);
}

let selectedExpenseIndex = null;

function editExpenseEntry(index) {
    selectedExpenseIndex = index;
    const entry = expenseEntries[index];
    if (entry) {
        const voucherNoVal = entry.voucherno || "";
        const approvedByVal = entry.approvedby || "";

        document.getElementById('editExpVoucherNo').value = voucherNoVal;
        document.getElementById('editExpSector').value = entry.sector;
        document.getElementById('editExpApprovedBy').value = approvedByVal;
        document.getElementById('editExpAmount').value = entry.amount;
        document.getElementById('editExpProject').value = entry.project || "";

        let rawDate = entry.date;
        let formattedDate = "";
        if (rawDate) {
            let parts = rawDate.split('/');
            if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }
        document.getElementById('editExpDate').value = formattedDate;

        document.getElementById('editExpenseModal').style.display = 'flex';
    }
}

function closeEditExpenseModal() {
    document.getElementById('editExpenseModal').style.display = 'none';
    document.getElementById('editExpenseForm').reset();
}

function closeEditExpenseModalOutside(event) {
    if (event.target.id === 'editExpenseModal') {
        closeEditExpenseModal();
    }
}

async function saveEditedExpenseEntry(event) {
    event.preventDefault();
    if (selectedExpenseIndex === null) return;

    const voucherNo = document.getElementById('editExpVoucherNo').value;
    const rawDate = document.getElementById('editExpDate').value;
    const sector = document.getElementById('editExpSector').value;
    const approvedBy = document.getElementById('editExpApprovedBy').value;
    const amount = parseInt(document.getElementById('editExpAmount').value) || 0;
    const project = document.getElementById('editExpProject').value;

    let dateParts = rawDate.split('-');
    let dateStr = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];

    showCustomPopup("⏳", "ব্যয় সংশোধন ক্লাউডে সংরক্ষিত হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('expenses')
            .update({
                date: dateStr,
                sector: sector,
                approvedby: approvedBy,
                amount: amount,
                project: project
            })
            .eq('voucherno', voucherNo);

        if (error) throw error;

        expenseEntries[selectedExpenseIndex].date = dateStr;
        expenseEntries[selectedExpenseIndex].sector = sector;
        expenseEntries[selectedExpenseIndex].approvedby = approvedBy;
        expenseEntries[selectedExpenseIndex].amount = amount;
        expenseEntries[selectedExpenseIndex].project = project;

        closeEditExpenseModal();
        closeCustomPopup();

        showCustomPopup("✅", "ব্যয়ের রেকর্ড সফলভাবে আপডেট করা হয়েছে।", true);
        renderExpenseTable();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: ব্যয়ের রেকর্ড সংশোধন করা সম্ভব হয়নি।", true);
    }
}

function openExpenseModal() {
    document.getElementById('expenseModal').style.display = 'flex';
    document.getElementById('expVoucherNo').value = 'AF-EXP-' + globalExpenseCounter;

    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    document.getElementById('expDate').value = yyyy + '-' + mm + '-' + dd;
}

function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
    document.getElementById('expenseForm').reset();
}

function closeExpenseModalOutside(event) {
    if (event.target.id === 'expenseModal') closeExpenseModal();
}

async function saveExpenseEntry(event) {
    event.preventDefault();
    const voucherNo = document.getElementById('expVoucherNo').value;
    const rawDate = document.getElementById('expDate').value;
    const sector = document.getElementById('expSector').value;
    const approvedBy = document.getElementById('expApprovedBy').value;
    const amount = parseInt(document.getElementById('expAmount').value) || 0;
    const project = document.getElementById('expProject').value;

    let dateParts = rawDate.split('-');
    let dateStr = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];

    const entry = {
        voucherno: voucherNo,
        date: dateStr,
        sector: sector,
        approvedby: approvedBy,
        amount: amount,
        project: project
    };

    showCustomPopup("⏳", "ব্যয় এন্ট্রি ক্লাউডে সংরক্ষিত হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('expenses')
            .insert([entry]);
        if (error) throw error;

        expenseEntries.push(entry);
        globalExpenseCounter++;

        closeExpenseModal();
        closeCustomPopup();

        showCustomPopup("✅", "ব্যয়ের রেকর্ড সফলভাবে এন্ট্রি হয়েছে।", true);
        renderExpenseTable();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: ব্যয়ের রেকর্ড সেভ হয়নি।", true);
    }
}

async function deleteExpenseEntry(index) {
    const entry = expenseEntries[index];
    const voucherNo = entry.voucherno;

    showConfirmModal(`আপনি কি নিশ্চিত যে এই ব্যয়ের রেকর্ডটি (${voucherNo}) মুছে ফেলতে চান?`, async function () {
        showCustomPopup("⏳", "ডাটাবেজ থেকে তথ্য ডিলিট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient
                .from('expenses')
                .delete()
                .eq('voucherno', voucherNo);
            if (error) throw error;

            expenseEntries.splice(index, 1);
            closeCustomPopup();
            showCustomPopup("✅", 'ব্যয়ের রেকর্ডটি মুছে ফেলা হয়েছে।', true);
            renderExpenseTable();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: তথ্য মোছা সম্ভব হয়নি।", true);
        }
    });
}

// ==================================================
// 💰 আয়ের এন্ট্রি সংশোধন লজিক
// ==================================================
let selectedDonationIndex = null;

function editDonationEntry(index) {
    selectedDonationIndex = index;
    const entry = donationEntries[index];
    if (!entry) return;

    const modal = document.getElementById('editDonationModal');
    if (!modal) return;

    const setSafeValue = (id, val) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = val;
        }
    };

    setSafeValue('editDonReceiptNo', entry.receiptNo || '');
    setSafeValue('editDonName', entry.name || '');
    setSafeValue('editDonAddress', entry.address || '');
    setSafeValue('editDonPhone', entry.phone || '');
    setSafeValue('editDonAmount', entry.amount || '');
    setSafeValue('editDonSector', entry.sector || '');
    setSafeValue('editDonProject', entry.project || '');

    let formattedDate = "";
    if (entry.date) {
        let parts = entry.date.split('/');
        if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }
    setSafeValue('editDonDate', formattedDate);

    modal.style.display = 'flex';
}

function closeEditDonationModal() {
    document.getElementById('editDonationModal').style.display = 'none';
    document.getElementById('editDonationForm').reset();
}

function closeEditDonationModalOutside(event) {
    if (event.target.id === 'editDonationModal') {
        closeEditDonationModal();
    }
}

async function saveEditedDonationEntry(event) {
    event.preventDefault();
    if (selectedDonationIndex === null) return;

    const receiptNo = document.getElementById('editDonReceiptNo').value;
    const rawDate = document.getElementById('editDonDate').value;
    const name = document.getElementById('editDonName').value;
    const address = document.getElementById('editDonAddress').value;
    const phone = document.getElementById('editDonPhone').value;
    const amount = parseInt(document.getElementById('editDonAmount').value) || 0;
    const sector = document.getElementById('editDonSector').value;
    const project = document.getElementById('editDonProject').value;

    let dateParts = rawDate.split('-');
    let dateStr = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];

    showCustomPopup("⏳", "আয়ের সংশোধন ক্লাউডে সংরক্ষিত হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('donations')
            .update({
                date: dateStr,
                name: name,
                address: address,
                phone: phone,
                amount: amount,
                sector: sector,
                project: project
            })
            .eq('receiptNo', receiptNo);

        if (error) throw error;

        donationEntries[selectedDonationIndex].date = dateStr;
        donationEntries[selectedDonationIndex].name = name;
        donationEntries[selectedDonationIndex].address = address;
        donationEntries[selectedDonationIndex].phone = phone;
        donationEntries[selectedDonationIndex].amount = amount;
        donationEntries[selectedDonationIndex].sector = sector;
        donationEntries[selectedDonationIndex].project = project;

        closeEditDonationModal();
        closeCustomPopup();

        showCustomPopup("✅", "আয়ের রেকর্ড সফলভাবে সংশোধন করা হয়েছে।", true);
        refreshAllData();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: আয়ের রেকর্ড সংশোধন করা সম্ভব হয়নি।", true);
    }
}

window.verifyExecPassword = verifyExecPassword;
window.sendResetCode = sendResetCode;
window.verifyResetCode = verifyResetCode;
window.updateNewPassword = updateNewPassword;
window.handleDirectRegistration = handleDirectRegistration;

// ==================================================
// 📄 ডিজিটাল রশিদ জেনারেটর ফাংশন
// ==================================================
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

function openGeneralIncomeModal() {
    document.getElementById('generalIncomeModal').style.display = 'flex';
    document.getElementById('genReceiptNo').value = 'AF-REC-' + globalReceiptCounter;

    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();
    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;
    document.getElementById('genDate').value = yyyy + '-' + mm + '-' + dd;
}

function closeGeneralIncomeModal() {
    document.getElementById('generalIncomeModal').style.display = 'none';
    document.getElementById('generalIncomeForm').reset();
}

function closeGeneralIncomeModalOutside(event) {
    if (event.target.id === 'generalIncomeModal') closeGeneralIncomeModal();
}

async function saveGeneralIncomeEntry(event) {
    event.preventDefault();
    const receiptNo = document.getElementById('genReceiptNo').value;
    const rawDate = document.getElementById('genDate').value;
    const sourceDesc = document.getElementById('genSourceDesc').value;
    const amount = parseInt(document.getElementById('genAmount').value) || 0;
    const project = document.getElementById('genProject').value;

    let dateParts = rawDate.split('-');
    let dateStr = dateParts[2] + '/' + dateParts[1] + '/' + dateParts[0];

    const entry = {
        receiptNo: receiptNo,
        date: dateStr,
        name: sourceDesc,
        address: "সাধারণ তহবিল",
        phone: "---",
        amount: amount,
        sector: "সাধারণ আয়ের এন্ট্রি",
        project: project
    };

    showCustomPopup("⏳", "সাধারণ আয়ের এন্ট্রি ডাটাবেজে সংরক্ষিত হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('donations')
            .insert([entry]);
        if (error) throw error;

        donationReceiptsStatus[receiptNo] = false;
        localStorage.setItem('ababil_donation_receipt_status', JSON.stringify(donationReceiptsStatus));

        globalReceiptCounter++;

        await loadAllDataFromSupabase();

        closeGeneralIncomeModal();
        closeCustomPopup();

        showCustomPopup("✅", "সাধারণ আয়ের রেকর্ড সফলভাবে এন্ট্রি হয়েছে।", true);
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: রেকর্ড সেভ করা যায়নি।", true);
    }
}

window.openGeneralIncomeModal = openGeneralIncomeModal;
window.closeGeneralIncomeModal = closeGeneralIncomeModal;
window.closeGeneralIncomeModalOutside = closeGeneralIncomeModalOutside;
window.saveGeneralIncomeEntry = saveGeneralIncomeEntry;

// ==================================================
// 🔀 আয় এন্ট্রি সাব-ট্যাব পরিবর্তন ফাংশন
// ==================================================
function switchIncomeSubTab(tab) {
    const generalView = document.getElementById('generalIncomeSubView');
    const donationView = document.getElementById('donationIncomeSubView');
    const btnGeneral = document.getElementById('btnSubTabGeneral');
    const btnDonation = document.getElementById('btnSubTabDonation');

    if (tab === 'general') {
        generalView.style.display = 'block';
        donationView.style.display = 'none';
        btnGeneral.classList.add('active');
        btnDonation.classList.remove('active');
    } else if (tab === 'donation') {
        generalView.style.display = 'none';
        donationView.style.display = 'block';
        btnGeneral.classList.remove('active');
        btnDonation.classList.add('active');
    }
}

window.switchIncomeSubTab = switchIncomeSubTab;

/// ==================================================
// 📋 নতুন আয়ের (দাতার অনুদান) টেবিল রেন্ডারিং ফাংশন
// ==================================================
function renderDonationTable() {
    const tbody = document.getElementById('donationTableBody');
    if (!tbody) return;

    const donationsOnly = donationEntries.filter(e => e.sector !== "সাধারণ আয়ের এন্ট্রি");

    if (donationsOnly.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); font-style:italic;">বর্তমানে কোনো আয়ের খাতের তথ্য যুক্ত করা হয়নি।</td></tr>`;
        return;
    }
    let html = '';
    donationsOnly.forEach((entry) => {
        let mainIndex = donationEntries.indexOf(entry);
        let isGenerated = donationReceiptsStatus[entry.receiptNo];
        let receiptCell = isGenerated ?
            `<span class="receipt-status-sent" onclick="showDirectDonationReceipt('${entry.receiptNo}')">রশিদ পাঠানো হয়েছে</span>` :
            `<span class="receipt-status-send" onclick="generateDonationReceiptAction('${entry.receiptNo}')">রশিদ পাঠান</span>`;

        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="রশিদ নং"><span style="color:var(--primary); font-weight:bold;">${entry.receiptNo}</span></td>
            <td data-label="দাতার নাম"><strong>${entry.name}</strong></td>
            <td data-label="রশিদের অবস্থা">${receiptCell}</td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-donation-${mainIndex}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'donation-${mainIndex}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editDonationEntry(${mainIndex})">Edit</button>
                            <button class="btn-delete" onclick="deleteDonationEntry(${mainIndex})">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-donation-icon-${mainIndex}" onclick="event.stopPropagation(); toggleDonationDetailsRow('${mainIndex}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="donation-details-row-${mainIndex}" style="display: none; background-color: #f8fafc;">
            <td colspan="4" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left; animation: fadeIn 0.25s ease-out; box-shadow: var(--shadow);">
                    <p style="margin: 2px 0;"><strong>📅 তারিখ:</strong> ${entry.date}</p>
                    <p style="margin: 2px 0;"><strong>📍 ঠিকানা:</strong> ${entry.address}</p>
                    <p style="margin: 2px 0;"><strong>📞 মোবাইল:</strong> ${entry.phone || '---'}</p>
                    <p style="margin: 2px 0;"><strong>📂 খাত:</strong> ${entry.sector}</p>
                                <p style="margin: 2px 0;"><strong>📁 প্রজেক্টের নাম:</strong> ${entry.project || '---'}</p>
                                <p style="margin: 2px 0;"><strong>💰 পরিমাণ:</strong> ${entry.amount}/-</p>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ==================================================
// 📋 সাধারণ আয়ের টেবিল রেন্ডারিং ফাংশন
// ==================================================
function renderGeneralIncomeTable() {
    const tbody = document.getElementById('generalIncomeTableBody');
    if (!tbody) return;

    const generalOnly = donationEntries.filter(e => e.sector === "সাধারণ আয়ের এন্ট্রি");

    if (generalOnly.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-style:italic;">বর্তমানে কোনো সাধারণ আয়ের খাতের তথ্য যুক্ত করা হয়নি।</td></tr>`;
        return;
    }
    let html = '';
    generalOnly.forEach((entry) => {
        let mainIndex = donationEntries.indexOf(entry);
        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="রশিদ নং"><span style="color:var(--primary); font-weight:bold;">${entry.receiptNo}</span></td>
            <td data-label="খাত বিবরণী"><strong>${entry.name}</strong></td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-donation-${mainIndex}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'donation-${mainIndex}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editDonationEntry(${mainIndex})">Edit</button>
                            <button class="btn-delete" onclick="deleteDonationEntry(${mainIndex})">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-general-icon-${mainIndex}" onclick="event.stopPropagation(); toggleGeneralDetailsRow('${mainIndex}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="general-details-row-${mainIndex}" style="display: none; background-color: #f8fafc;">
            <td colspan="3" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left; animation: fadeIn 0.25s ease-out; box-shadow: var(--shadow);">
                   <p style="margin: 2px 0;"><strong>📅 তারিখ:</strong> ${entry.date}</p>
                                <p style="margin: 2px 0;"><strong>💰 পরিমাণ:</strong> ${entry.amount}/-</p>
                                <p style="margin: 2px 0;"><strong>📁 প্রজেক্টের নাম:</strong> ${entry.project || '---'}</p>
                                <p style="margin: 2px 0;"><strong>📂 খাত টাইপ:</strong> ${entry.sector}</p>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ==================================================
// 🔄 ড্রপডাউন টগল ফাংশনসমূহ
// ==================================================
function toggleDonationDetailsRow(index) {
    const detailsDiv = document.getElementById('donation-details-row-' + index);
    const icon = document.getElementById('toggle-donation-icon-' + index);
    if (!detailsDiv) return;
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

function toggleGeneralDetailsRow(index) {
    const detailsDiv = document.getElementById('general-details-row-' + index);
    const icon = document.getElementById('toggle-general-icon-' + index);
    if (!detailsDiv) return;
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

window.toggleDonationDetailsRow = toggleDonationDetailsRow;
window.toggleGeneralDetailsRow = toggleGeneralDetailsRow;
window.renderDonationTable = renderDonationTable;
window.renderGeneralIncomeTable = renderGeneralIncomeTable;

// ==================================================
// 🔍 ড্যাশবোর্ড সার্চ ফিল্টারিং ফাংশনসমূহ
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

function liveSearchGeneralIncome() {
    let input = document.getElementById('generalIncomeSearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('generalIncomeTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i += 2) {
        let mainRow = rows[i];
        let detailRow = rows[i + 1];
        if (!mainRow || !detailRow) continue;

        let receiptText = (mainRow.cells[0]?.textContent || "").toLowerCase();
        let descText = (mainRow.cells[1]?.textContent || "").toLowerCase();
        let detailText = (detailRow.textContent || "").toLowerCase();

        if (receiptText.includes(input) || descText.includes(input) || detailText.includes(input)) {
            mainRow.style.display = "";
            let toggleIcon = mainRow.querySelector('[id^="toggle-general-icon-"]');
            let isOpen = toggleIcon && toggleIcon.innerText === '▲';
            detailRow.style.display = isOpen ? ((window.innerWidth <= 768) ? 'block' : 'table-row') : 'none';
        } else {
            mainRow.style.display = "none";
            detailRow.style.display = "none";
        }
    }
}

function liveSearchDonationIncome() {
    let input = document.getElementById('donationIncomeSearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('donationTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i += 2) {
        let mainRow = rows[i];
        let detailRow = rows[i + 1];
        if (!mainRow || !detailRow) continue;

        let receiptText = (mainRow.cells[0]?.textContent || "").toLowerCase();
        let nameText = (mainRow.cells[1]?.textContent || "").toLowerCase();
        let detailText = (detailRow.textContent || "").toLowerCase();

        if (receiptText.includes(input) || nameText.includes(input) || detailText.includes(input)) {
            mainRow.style.display = "";
            let toggleIcon = mainRow.querySelector('[id^="toggle-donation-icon-"]');
            let isOpen = toggleIcon && toggleIcon.innerText === '▲';
            detailRow.style.display = isOpen ? ((window.innerWidth <= 768) ? 'block' : 'table-row') : 'none';
        } else {
            mainRow.style.display = "none";
            detailRow.style.display = "none";
        }
    }
}

function liveSearchExpenseEntry() {
    let input = document.getElementById('expenseEntrySearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('executiveExpenseTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let voucherText = (row.cells[0]?.textContent || "").toLowerCase();
        let sectorText = (row.cells[2]?.textContent || "").toLowerCase();
        let approvedText = (row.cells[3]?.textContent || "").toLowerCase();

        if (voucherText.includes(input) || sectorText.includes(input) || approvedText.includes(input)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    }
}

window.liveSearchMemberDetails = liveSearchMemberDetails;
window.liveSearchGeneralIncome = liveSearchGeneralIncome;
window.liveSearchDonationIncome = liveSearchDonationIncome;
window.liveSearchExpenseEntry = liveSearchExpenseEntry;

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
function populateProjectReportDropdown() {
    const select = document.getElementById('reportProjectSelect');
    if (!select) return;

    select.innerHTML = '';

    // ডাটাবেজের অনুদান খাত থেকে সকল ইউনিক প্রজেক্ট খুঁজে নেওয়া হচ্ছে
    const projects = [...new Set(donationEntries.map(e => e.project).filter(p => p && p.trim() !== ''))];

    if (projects.length === 0) {
        let opt = document.createElement('option');
        opt.text = "কোনো সচল প্রজেক্ট পাওয়া যায়নি";
        select.appendChild(opt);
        return;
    }

    let defaultOpt = document.createElement('option');
    defaultOpt.value = "";
    defaultOpt.text = "--- একটি প্রজেক্ট নির্বাচন করুন ---";
    select.appendChild(defaultOpt);

    projects.forEach(p => {
        let opt = document.createElement('option');
        opt.value = p;
        opt.text = p;
        select.appendChild(opt);
    });
}

// ১. ফন্ট সাইজ স্বয়ংক্রিয়ভাবে ছোট করে বিবরণী ১ পৃষ্ঠায় রাখার ডাইনামিক স্কেলিং ফাংশন
function adjustExcelReportFontSize() {
    const reportArea = document.getElementById('excelReportArea');
    if (!reportArea) return;

    // প্রথমে বেসলাইন ফন্ট সাইজে রিসেট করে নেওয়া হচ্ছে
    reportArea.style.fontSize = '';
    const tables = reportArea.querySelectorAll('.excel-grid-table');
    tables.forEach(t => {
        const cells = t.querySelectorAll('th, td');
        cells.forEach(c => c.style.fontSize = '');
    });

    // এ৪ পোর্ট্রেটের স্ট্যান্ডার্ড প্রিন্ট হাইট লিমিট হচ্ছে ১০২০ পিক্সেল
    const targetMaxHeight = 1020;
    let currentHeight = reportArea.scrollHeight;

    // যদি প্রজেক্টের আয়ের রো বেশি হয়ে ১ পৃষ্ঠা ছাড়িয়ে যায়, তবে সাইজ ধীরে ধীরে ছোট করবে
    if (currentHeight > targetMaxHeight) {
        let scaleFactor = 11; // ডিফল্ট বেসলাইন সাইজ
        while (currentHeight > targetMaxHeight && scaleFactor > 7.5) {
            scaleFactor -= 0.5;
            reportArea.style.fontSize = scaleFactor + 'px';
            tables.forEach(t => {
                const cells = t.querySelectorAll('th, td');
                cells.forEach(c => c.style.fontSize = scaleFactor + 'px');
            });
            currentHeight = reportArea.scrollHeight;
        }
    }
}

// ২. টাইপ করা প্রজেক্টের নামের ভিত্তিতে লাইভ বিবরণী প্রস্তুত করার ফাংশন
function generateProjectExcelReport() {
    const input = document.getElementById('reportProjectInput');
    if (!input) return;

    const selectedProject = input.value.trim();

    // প্রতিবেদন তৈরির বর্তমান লাইভ তারিখ (যেমন: 06/06/2026)
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    document.getElementById('excelReportDate').innerText = `${dd}/${mm}/${yyyy}`;

    if (!selectedProject) {
        document.getElementById('excelProjectHeaderTitle').innerText = "--- হিসাব বিবরণী";
        document.getElementById('excelIncomeReportBody').innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">অনুগ্রহ করে প্রজেক্টের নাম টাইপ করুন</td></tr>`;
        document.getElementById('excelExpenseReportBody').innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">অনুগ্রহ করে প্রজেক্টের নাম টাইপ করুন</td></tr>`;
        document.getElementById('excelTotalIncomeAmount').innerText = "০/-";
        document.getElementById('excelTotalExpenseAmount').innerText = "০/-";
        document.getElementById('excelCardIncome').innerText = "০/-";
        document.getElementById('excelCardExpense').innerText = "০/-";
        document.getElementById('excelCardBalance').innerText = "০/-";
        return;
    }

    // প্রজেক্টের নাম ও হিসাব বিবরণী একীভূত করে ডানে শো করা
    document.getElementById('excelProjectHeaderTitle').innerText = selectedProject + " হিসাব বিবরণী";

    // (ক) আয়ের ডেটা ফিল্টার (টাইপ করার সাথে সাথে লাইভ সার্চ হবে, Case-Insensitive)
    const filteredIncomes = donationEntries.filter(e => e.project && e.project.trim().toLowerCase().includes(selectedProject.toLowerCase()));
    let incomeHtml = '';
    let totalIncome = 0;

    if (filteredIncomes.length === 0) {
        incomeHtml = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">এই প্রজেক্টে কোনো আয়ের রেকর্ড পাওয়া যায়নি</td></tr>`;
    } else {
        filteredIncomes.forEach((d, idx) => {
            totalIncome += (parseInt(d.amount) || 0);
            incomeHtml += `<tr>
                <td style="font-weight: 700; text-align: center;">${idx + 1}</td>
                <td style="font-weight: 800; color: #000000; text-align: center;">${d.name || '---'}</td>
                <td style="text-align: center;">${d.address || '---'}</td>
                <td style="font-weight: 800; color: #1e40af; text-align: center;">${(d.amount || 0).toLocaleString('bn-BD')}/-</td>
            </tr>`;
        });
    }
    document.getElementById('excelIncomeReportBody').innerHTML = incomeHtml;
    document.getElementById('excelTotalIncomeAmount').innerText = totalIncome.toLocaleString('bn-BD') + '/-';

    // (খ) ব্যয়ের ডেটা ফিল্টার (টাইপ করার সাথে সাথে লাইভ সার্চ হবে, Case-Insensitive)
    const filteredExpenses = expenseEntries.filter(e => e.project && e.project.trim().toLowerCase().includes(selectedProject.toLowerCase()));
    let expenseHtml = '';
    let totalExpense = 0;

    if (filteredExpenses.length === 0) {
        expenseHtml = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">এই প্রজেক্টে কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি</td></tr>`;
    } else {
        filteredExpenses.forEach((e, idx) => {
            totalExpense += (parseInt(e.amount) || 0);
            expenseHtml += `<tr>
                <td style="text-align: center; font-weight: 700;">${e.date || '---'}</td>
                <td style="font-weight: 800; color: #000000; text-align: center;">${e.sector || '---'}</td>
                <td style="text-align: center;">${e.approvedby || '---'}</td>
                <td style="font-weight: 800; color: #b91c1c; text-align: center;">${(e.amount || 0).toLocaleString('bn-BD')}/-</td>
            </tr>`;
        });
    }
    document.getElementById('excelExpenseReportBody').innerHTML = expenseHtml;
    document.getElementById('excelTotalExpenseAmount').innerText = totalExpense.toLocaleString('bn-BD') + '/-';

    // (গ) ৩টি কার্ডের অটো জেনারেটেড ডাটা ও অবশিষ্ট তহবিল হিসাব
    const balance = totalIncome - totalExpense;

    document.getElementById('excelCardIncome').innerText = totalIncome.toLocaleString('bn-BD') + '/-';
    document.getElementById('excelCardExpense').innerText = totalExpense.toLocaleString('bn-BD') + '/-';
    document.getElementById('excelCardBalance').innerText = balance.toLocaleString('bn-BD') + '/-';

    // (ঘ) স্বয়ংক্রিয় ১-পাতার স্কেলিং নিশ্চিত করা
    setTimeout(adjustExcelReportFontSize, 50);
}

// ৩. পিডিএফ ডাউনলোড ফিক্স (এ ৪ পোর্ট্রেট ফরম্যাটে ওভারফ্লো ফ্রি প্রিন্ট মেথড)
async function downloadProjectExcelPDF() {
    const input = document.getElementById('reportProjectInput');
    if (!input) return;
    const selectedProject = input.value.trim();

    if (!selectedProject) {
        showCustomPopup("⚠️", "অনুগ্রহ করে ডাউনলোডের পূর্বে একটি প্রজেক্ট সিলেক্ট করুন।", true);
        return;
    }

    const prepName = document.getElementById('excelPreparerName').value.trim();
    const prepDesg = document.getElementById('excelPreparerDesignation').value.trim();

    if (!prepName || !prepDesg) {
        showCustomPopup("⚠️", "অনুগ্রহ করে প্রস্তুতকারীর নাম এবং পদবী পূরণ করুন।", true);
        return;
    }

    const element = document.getElementById('excelReportArea');
    if (!element) return;

    const cleanProjectName = selectedProject.replace(/[^a-zA-Z0-9\u0980-\u09FF_]/g, '_').replace(/__+/g, '_');
    const pdfFileName = `Project_Report_${cleanProjectName}.pdf`;

    showCustomPopup("⏳", "পিডিএফ রিপোর্ট তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", false);

    try {
        await new Promise(resolve => setTimeout(resolve, 300));

        const currentScrollY = window.scrollY;
        window.scrollTo(0, 0);

        const opt = {
            margin: [10, 10, 10, 10],
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
                format: 'a4',
                orientation: 'portrait'
            }
        };

        await html2pdf().set(opt).from(element).save();

        window.scrollTo(0, currentScrollY);
        closeCustomPopup();
        showCustomPopup("✅", "পিডিএফ ডাউনলোড সম্পন্ন হয়েছে!", true);

    } catch (error) {
        console.error("Project report PDF error:", error);
        window.scrollTo(0, currentScrollY);
        closeCustomPopup();
        showCustomPopup("❌", "ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।", true);
    }
}

// ৪. এক্সেল সফটওয়্যারে ওপেন করার জন্য .csv ফাইল ডাউনলোড করার মেথড
function exportProjectToCSV() {
    const input = document.getElementById('reportProjectInput');
    if (!input) return;
    const selectedProject = input.value.trim();

    if (!selectedProject) {
        showCustomPopup("⚠️", "অনুগ্রহ করে একটি প্রজেক্ট সিলেক্ট করুন।", true);
        return;
    }

    const filteredIncomes = donationEntries.filter(e => e.project && e.project.trim().toLowerCase().includes(selectedProject.toLowerCase()));
    if (filteredIncomes.length === 0) {
        showCustomPopup("⚠️", "এই প্রজেক্টের আন্ডারে কোনো ডাটা নেই।", true);
        return;
    }

    let csvContent = "\ufeff"; // বাংলা অক্ষরের সুরক্ষার জন্য UTF-8 BOM
    csvContent += "আবাবিল ফাউন্ডেশন\n";
    csvContent += "একটি সামাজিক স্বেচ্ছাসেবী সংগঠন\n";
    csvContent += "সূচীপাড়া; শাহরাস্তি; চাঁদপুর।\n";
    csvContent += `প্রজেক্ট: ${selectedProject}\n`;
    csvContent += `রিপোর্ট তৈরির তারিখ: ${document.getElementById('excelReportDate').innerText}\n\n`;
    csvContent += "ক্রমিক নং,দাতার নাম,ঠিকানা,দানের পরিমাণ\n";

    let total = 0;
    filteredIncomes.forEach((d, idx) => {
        total += d.amount;
        const name = d.name ? `"${d.name.replace(/"/g, '""')}"` : '---';
        const address = d.address ? `"${d.address.replace(/"/g, '""')}"` : '---';
        csvContent += `${idx + 1},${name},${address},${d.amount}\n`;
    });

    csvContent += `,,,सर्वমোট সংগৃহীত: ${total}/-\n`;

    const preparer = document.getElementById('excelPreparerName').value.trim() || '---';
    const designation = document.getElementById('excelPreparerDesignation').value.trim() || '---';
    csvContent += `\nপ্রস্তুতকারী: ${preparer},পদবী: ${designation}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const cleanProjectName = selectedProject.replace(/[^a-zA-Z0-9\u0980-\u09FF_]/g, '_').replace(/__+/g, '_');

    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Ababil_${cleanProjectName}_Excel.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// সকল ডাটা ক্রমানুসারে সাজানোর (সর্বশেষটি প্রথমে) ফাংশন
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
async function saveLiveTickerText(event) {
    event.preventDefault();
    const text = document.getElementById('tickerTextInput').value.trim();
    if (!text) {
        showCustomPopup("⚠️", "দয়া করে ফাঁকা নোটিশ সেভ করবেন না।", true);
        return;
    }

    showCustomPopup("⏳", "লাইভ নোটিশ ডাটাবেজে আপডেট হচ্ছে...", false);
    try {
        const { error } = await supabaseClient
            .from('admin_settings')
            .update({ ticker_text: text })
            .eq('id', 'config');

        if (error) throw error;

        // হোম পেজে লাইভ নোটিশের গ্লোবাল ভেরিয়েবল এবং ভিউ সাথে সাথে আপডেট করা হলো
        globalTickerText = text;
        const tickerEl = document.getElementById('liveTickerText');
        if (tickerEl) {
            tickerEl.innerText = text;
        }

        closeCustomPopup();
        showCustomPopup("✅", "হোম পেজের লাইভ নোটিশ সফলভাবে আপডেট হয়েছে!", true);
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: নোটিশ ডাটাবেজে সেভ করা যায়নি। " + err.message, true);
    }
}

// গ্লোবাল স্কোপে এক্সপোর্ট করা
window.saveLiveTickerText = saveLiveTickerText;

// ১. বাংলা সংখ্যায় মসৃণ ও স্বয়ংক্রিয়ভাবে অ্যানিমেশন করার গ্লোবাল ফাংশন
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
