<script lang="ts">
    import Modal from '$lib/components/Modal.svelte';
    
    interface Props {
        isOpen: boolean;
        closeModal: () => void;
    }
    
    let { isOpen, closeModal }: Props = $props();
</script>

<Modal isOpen={isOpen} handleCloseModal={closeModal} width="max(90%, 800px)" height="fit-content">
    <div class="p-6 w-full">
        <h2 class="text-2xl font-bold text-text-300 mb-6 text-center">Arabic Diacritical Marks Guide</h2>
        
        <div class="overflow-x-auto">
            <table class="w-full border-collapse border border-tile-300 text-sm">
                <thead>
                    <tr class="bg-tile-200">
                        <th class="border border-tile-300 p-3 text-left font-bold text-text-300">Diacritic</th>
                        <th class="border border-tile-300 p-3 text-left font-bold text-text-300">Arabic Name</th>
                        <th class="border border-tile-300 p-3 text-center font-bold text-text-300">Mark</th>
                        <th class="border border-tile-300 p-3 text-left font-bold text-text-300">What It Does / Sound</th>
                        <th class="border border-tile-300 p-3 text-left font-bold text-text-300">Example</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Fatḥa</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">الفتحة</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">َ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Short <strong>a</strong> sound (as in "cat")</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بَ = <em>ba</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Kasra</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">الكسرة</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ِ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Short <strong>i</strong> sound (as in "sit")</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بِ = <em>bi</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Ḍamma</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">الضمة</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ُ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Short <strong>u</strong> sound (as in "put")</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بُ = <em>bu</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Sukūn</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">السكون</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ْ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Indicates <strong>no vowel</strong>, consonant stops</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بْ = <em>b</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Shadda</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">الشدة</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ّ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Doubles (geminates) the consonant</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بّ = <em>bb</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Tanween Fatḥ</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">تنوين الفتح</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ً</td>
                        <td class="border border-tile-300 p-3 text-text-200">"an" ending (nunation)</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بً = <em>ban</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Tanween Kasr</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">تنوين الكسر</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ٍ</td>
                        <td class="border border-tile-300 p-3 text-text-200">"in" ending</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بٍ = <em>bin</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Tanween Ḍamm</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">تنوين الضم</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ٌ</td>
                        <td class="border border-tile-300 p-3 text-text-200">"un" ending</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">بٌ = <em>bun</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Maddah</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">المدة</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">آ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Long <strong>ā</strong> with glottal stop before</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">آ = <em>ā</em> (longer than fatḥa)</td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Alif Khanjariyya</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">الألف الخنجرية</td>
                        <td class="border border-tile-300 p-3 text-center text-2xl font-arabic text-tile-700">ٰ</td>
                        <td class="border border-tile-300 p-3 text-text-200">Indicates long <strong>ā</strong> in certain fixed words</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">رَحْمٰن = <em>raḥmān</em></td>
                    </tr>
                    <tr class="hover:bg-tile-100">
                        <td class="border border-tile-300 p-3 font-semibold text-text-300">Hamza</td>
                        <td class="border border-tile-300 p-3 text-text-200" dir="rtl">الهمزة</td>
                        <td class="border border-tile-300 p-3 text-center text-xl font-arabic text-tile-700">أ / إ / ؤ / ئ / ء</td>
                        <td class="border border-tile-300 p-3 text-text-200">Represents a glottal stop; placement depends on the seat</td>
                        <td class="border border-tile-300 p-3 text-text-200 font-arabic text-xl" dir="rtl">سؤال = <em>su'āl</em></td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="mt-6 text-center">
            <button
                onclick={closeModal}
                class="px-6 py-2 bg-tile-500 text-text-300 rounded-lg hover:bg-tile-600 transition-colors font-semibold"
            >
                Close
            </button>
        </div>
    </div>
</Modal>

