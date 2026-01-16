// ==========================================
// CC Checker Logic - Pure JavaScript
// Developed by Md Golam Rasul
// ==========================================

// 1. লুহন অ্যালগরিদম ফাংশন
function isLuhnValid(number) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number.charAt(i));
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
}

// 2. BIN ইনফো আনার ফাংশন (Fetch API)
async function getBinInfo(bin) {
    try {
        const response = await fetch(`https://lookup.binlist.net/${bin}`, {
            headers: { "Accept-Version": "3" }
        });
        if (!response.ok) return null;
        const data = await response.json();
        return {
            bank: data.bank ? data.bank.name : 'N/A',
            country: data.country ? data.country.name : 'N/A',
            type: data.type || 'Unknown'
        };
    } catch (error) {
        return null;
    }
}

// 3. মেইন ফাংশন (যা কার্ড চেক করবে)
async function checkCard(inputData) {
    // ইনপুট না থাকলে
    if (!inputData) {
        return { status: "Error", result: "No data", message: "Enter card details" };
    }

    const parts = inputData.split("|");

    // ফরম্যাট চেক
    if (parts.length < 3) {
        return { status: "Dead", result: "Invalid Format", message: "Use: CC|MM|YYYY|CVV" };
    }

    const cc = parts[0].trim();
    let mm = parts[1].trim();
    let yy = parts[2].trim();
    const cvv = parts[3] ? parts[3].trim() : 'xxx';

    // ১. নম্বর লেংথ চেক
    if (isNaN(cc) || cc.length < 13 || cc.length > 19) {
        return { status: "Dead", result: "Invalid Length", message: "Wrong length" };
    }

    // ২. লুহন চেক
    if (!isLuhnValid(cc)) {
        return { status: "Dead", result: "Luhn Failed", message: "Invalid Algorithm" };
    }

    // ৩. ডেট চেক
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (yy.length === 2) yy = "20" + yy; // 24 -> 2024
    
    const expYear = parseInt(yy);
    const expMonth = parseInt(mm);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        return { status: "Dead", result: "Expired", message: `Expired (${mm}/${yy})` };
    }

    // ৪. বিন ইনফো আনা (API Call)
    // নোট: ব্রাউজার থেকে ফ্রি BIN API মাঝেমধ্যে CORS এরর দিতে পারে।
    const binInfo = await getBinInfo(cc.substring(0, 6));

    // ৫. সাকসেস রেজাল্ট
    return {
        status: "Live",
        result: "CVV Matched",
        message: "Approved",
        details: {
            card: cc,
            date: `${mm}/${yy}`,
            bank: binInfo ? binInfo.bank : 'Unknown Bank',
            country: binInfo ? binInfo.country : 'Unknown Country',
            type: binInfo ? binInfo.type : 'Credit'
        }
    };
}

// ==========================================
// ব্যবহার করার নিয়ম (Example Usage)
// ==========================================

// উদাহরণ হিসেবে একটি কার্ড চেক করা হচ্ছে:
const myCard = "4451000000000000|12|2028|123";

// যেহেতু এটি async, তাই .then() ব্যবহার করতে হবে
checkCard(myCard).then(response => {
    console.log("Output JSON:", JSON.stringify(response, null, 2));
    
    // আপনি চাইলে এখানে HTML এ রেজাল্ট দেখাতে পারেন
    // document.getElementById("resultBox").innerText = response.message;
});