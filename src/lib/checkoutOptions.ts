// Shared by the cart checkout and landing page checkout forms.

// Used until a policy is saved in admin › Website › General Setting.
export const DEFAULT_DELIVERY_POLICY = `<h4>হোম ডেলিভারি পলিসি</h4>
<p>ঢাকা, চট্টগ্রাম এবং সিলেট শহরে আমাদের নিজস্ব হোম ডেলিভারি সুবিধা রয়েছে। হোম ডেলিভারি চার্জ মাত্র ৬০ টাকা।</p>
<ul>
<li>বহুতল ভবনের ২য় তলা পর্যন্ত যেকোন ওজনের পণ্য বিদ্যমান ডেলিভারি চার্জে সরবরাহ করা হবে।</li>
<li>২য় তলার উপরে ১৫ কেজি পর্যন্ত পণ্য বর্তমান চার্জে, এরপর প্রতি ৫ কেজি ওজনে অতিরিক্ত ১০ টাকা প্রযোজ্য।</li>
<li>ভবনে লিফট থাকলে এবং লিফটে পণ্য বহন করা গেলে অতিরিক্ত ডেলিভারি চার্জ প্রযোজ্য হবে না।</li>
</ul>
<h4>কুরিয়ার ডেলিভারি পলিসি:</h4>
<p>ঢাকা, চট্টগ্রাম, সিলেট ও কুমিল্লা শহর ব্যতীত যেসব এলাকায় আমাদের নিজস্ব হোম ডেলিভারি সেবা চালু নেই, সেসব এলাকায় কুরিয়ারের মাধ্যমে পণ্য সরবরাহ করা হয়। সেক্ষেত্রে নিম্নোক্ত শর্তাবলি প্রযোজ্য হবে—</p>
<h5>স্টেডফাস্ট কুরিয়ার:</h5>
<ul>
<li>ঢাকার বাইরে সারাদেশে কুরিয়ারের মাধ্যমে হোম ডেলিভারি প্রদান করা হবে।</li>
<li>হোম ডেলিভারির ক্ষেত্রে পার্সেলের ওজন সর্বোচ্চ ৩ কেজি পর্যন্ত ডেলিভারি চার্জ ১৬০ টাকা। ৩ কেজির বেশি হলে অতিরিক্ত প্রতি কেজির জন্য ২০ টাকা করে চার্জ প্রযোজ্য (প্যাকেজিং এর ওজন সহ)।</li>
<li>ঢাকার বাইরে হাব অফিস থেকে নিলে প্রতি কেজি ১৫ টাকা ডেলিভারি চার্জ (অন্তত ১০ কেজি ওজন হতে হবে) (প্যাকেজিং এর ওজন সহ)।</li>
<li>ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য। তবে কুরিয়ার চার্জ বাবদ ন্যূনতম ১৬০ টাকা অগ্রিম পরিশোধ করতে হবে।</li>
<li>পার্সেল বুকিংয়ের পর ডেলিভারি সম্পন্ন হতে সর্বোচ্চ ২-৩ দিন সময় লাগতে পারে।</li>
<li>যেকোনো পচনশীল পণ্য কুরিয়ারের মাধ্যমে পাঠানো হবে না।</li>
</ul>`;

// Local YYYY-MM-DD, `days` from today, for the delivery date input.
export const toDateInputValue = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Half-hour delivery slots for the whole day, e.g. "03:30 PM".
export const DELIVERY_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2);
  const label = `${String(hour % 12 || 12).padStart(2, "0")}:${i % 2 ? "30" : "00"} ${hour < 12 ? "AM" : "PM"}`;
  return { value: label, label };
});

export const normalizePhoneNumber = (value: string) =>
  value
    .replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)))
    .replace(/\D/g, "");

export const BD_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapai Nawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

export function getCouponErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLowerCase();
  if (lower.includes("expired")) return "এই কুপনের মেয়াদ শেষ।";
  if (lower.includes("minimum order amount"))
    return message.replace(
      "Minimum order amount is",
      "এই কুপনের জন্য ন্যূনতম অর্ডার",
    );
  if (lower.includes("inactive")) return "এই কুপনটি এখন inactive।";
  if (lower.includes("not found")) return "কুপন কোড পাওয়া যায়নি।";
  return message || "কুপন প্রযোজ্য নয়।";
}
