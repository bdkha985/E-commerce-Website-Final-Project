// public/javascripts/checkout.js
document.addEventListener('DOMContentLoaded', () => {
    
    const addressSelector = document.getElementById('addressSelector');
    if (!addressSelector) {
        return; // Thoát nếu không có dropdown (user là guest)
    }

    // Lấy các ô input
    const streetInput = document.getElementById('street');
    const wardInput = document.getElementById('ward');
    const cityInput = document.getElementById('city');
    // const phoneInput = document.getElementById('phone'); // SĐT giờ đã fill từ user.phone

    addressSelector.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];

        if (selectedOption.value === "") {
            // Nếu chọn "-- Chọn một địa chỉ --"
            streetInput.value = "";
            wardInput.value = "";
            cityInput.value = "";
            return;
        }

        // Lấy data từ option
        const street = selectedOption.dataset.street;
        const ward = selectedOption.dataset.ward;
        const city = selectedOption.dataset.city;

        // Điền data vào form
        if (streetInput) streetInput.value = street;
        if (wardInput) wardInput.value = ward;
        if (cityInput) cityInput.value = city;
    });

});