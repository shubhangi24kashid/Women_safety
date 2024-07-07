function toggleMenu() {
    var menu = document.querySelector('nav ul');
    menu.classList.toggle('show');
  }

async function sendSOS() {
  const emergencyMessage = "Emergency! Please help!";

  try {
    const response = await fetch('/sendEmergencyAlert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: emergencyMessage })
    });

    if (response.ok) {
      alert('Emergency SOS sent to contacts!');
    } else {
      throw new Error('Failed to send SOS.');
    }
  } catch (error) {
    console.error('Error sending SOS:', error);
    alert('Failed to send SOS.');
  }
}

  