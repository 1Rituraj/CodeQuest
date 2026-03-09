fetch("navbar.html")
  .then(res => res.text())
  .then(html => {
    const navbarWrapper = document.createElement("div");
    navbarWrapper.innerHTML = html;

    //  Insert navbar ABOVE the container, not inside
    const container = document.querySelector(".container");
    if (container) {
      container.parentNode.insertBefore(navbarWrapper, container);
    } else {
      document.body.prepend(navbarWrapper); // fallback
    }

    //  Avatar and dropdown logic
    const avatar = document.getElementById("navAvatar");
    const dropdown = document.getElementById("dropdownMenu");
    const avatarImg = localStorage.getItem("avatarBase64");
    const name = localStorage.getItem("playerName") || "U";

    if (avatarImg) {
      const img = document.createElement("img");
      img.src = avatarImg;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      avatar.innerHTML = "";
      avatar.appendChild(img);
    } else {
      avatar.textContent = name.charAt(0).toUpperCase();
    }

    avatar.addEventListener("click", () => {
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = "none";
      }
    });

    const toggleTheme = document.getElementById("themeToggle");
    if (toggleTheme) {
      toggleTheme.addEventListener("click", (e) => {
        e.preventDefault();
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        toggleTheme.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
      });

      // On load, apply theme
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        toggleTheme.innerText = "☀️ Light Mode";
      }
    }
    //  Fix Learn link to force full-page load
    const learnLink = navbarWrapper.querySelector('a[href="learn.html"]');
    if (learnLink) {
      learnLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location.href = "learn.html";
      });
    }



  });

function logout() {
  // Only remove login-related info
  localStorage.removeItem("playerId");
  // localStorage.removeItem("playerName");
  // localStorage.removeItem("avatarBase64");
  // leave learnWatched and courseCompleted untouched

  window.location.href = "login.html";
}


