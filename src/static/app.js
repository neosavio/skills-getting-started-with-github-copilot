document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select (keep default placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p><strong>Description:</strong> ${details.description}</p>
          <p><strong>Time:</strong> ${details.time || details.schedule || ''}</p>
          <p><strong>Capacity:</strong> ${details.participants.length}/${details.max_participants}</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            <ul class="participants-list">
              ${details.participants.length > 0 
                ? details.participants.map(email => `<li><span class="participant-email">${email}</span><button class="delete-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" aria-label="Unregister">✖</button></li>`).join('')
                : '<li class="no-participants">No participants yet</li>'}
            </ul>
          </div>
        `;
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Attach delete handlers for this card's buttons
        activityCard.querySelectorAll('.delete-participant').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const activity = decodeURIComponent(btn.getAttribute('data-activity'));
            const email = decodeURIComponent(btn.getAttribute('data-email'));

            try {
              const res = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
              const result = await res.json();
              if (res.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                // Refresh list
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || 'Failed to unregister participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            } catch (err) {
              console.error('Error unregistering:', err);
              messageDiv.textContent = 'Failed to unregister. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so the newly signed-up participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
