document.addEventListener('DOMContentLoaded', () => {
    const bmiForm = document.getElementById('bmiForm');
    const resultBox = document.getElementById('resultBox');
    const bmiScore = document.getElementById('bmiScore');
    const bmiStatus = document.getElementById('bmiStatus');

    bmiForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value);

        if (weight > 0 && height > 0) {
            const data = calculateBMI(weight, height);

            bmiScore.textContent = data.score;
            bmiStatus.textContent = data.status;
            resultBox.classList.remove('hidden');

            const jsonData = JSON.stringify(data);
            

            console.log("JSON data:", jsonData); 
            

        } else {
            alert("Invalid input! Please enter positive numbers.");
        }
    });
});

function calculateBMI(weight, height) {
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    let status = "";

    if (bmi < 18.5) status = "Underweight";
    else if (bmi <= 24.9) status = "Normal";
    else if (bmi <= 29.9) status = "Overweight";
    else status = "Obese";

    return { 
        score: bmi, 
        status: status,
        timestamp: new Date().toISOString()
    };
}