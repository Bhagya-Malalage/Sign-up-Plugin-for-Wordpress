document.addEventListener("DOMContentLoaded", function () {
  // API Keys
  const OTP_KEY = CryptoJS.enc.Latin1.parse("aNdRfUjXn2r5u8x/A?D(G+KbPeShVkYp");
  const USER_KEY = CryptoJS.enc.Latin1.parse(
    "Rp}ex:?zG0=&m&,DOX$X<:HI>G=LNKeL",
  );
  const IV = CryptoJS.enc.Hex.parse("00000000000000000000000000000000");

  let otpInterval;
  const overlay = document.getElementById("yolo-signup-overlay");

  function encrypt(data, key) {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
      iv: IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
  }

  // --- POPUP CONTROL LOGIC ---
  function openYoloSignup() {
    if (overlay) {
      // Using flex ensures the popup card stays centered as per our CSS
      overlay.style.display = "flex";
    }
  }

  // Listen for clicks on ANY button or link globally
  document.addEventListener("click", function (e) {
    // Check if the clicked element or any of its parents has the 'yolo-trigger' class
    const isTriggerClass = e.target.closest(".yolo-trigger");

    // Fallback: Check if it's a button/link containing "Signup" or "Login" text
    const isAuthBtn =
      (e.target.tagName === "BUTTON" || e.target.tagName === "A") &&
      /signup|sign up|login|register/i.test(e.target.innerText);

    if (isTriggerClass || isAuthBtn) {
      // Don't trigger if it's a button INSIDE the popup card itself
      if (e.target.closest(".yolo-card")) return;

      console.log("YOLO Trigger Clicked");
      e.preventDefault();
      openYoloSignup();
    }
  });

  // 1. Username Real-time Check
  let userTimer;
  const userField = document.getElementById("y-user");
  if (userField) {
    userField.addEventListener("input", function (e) {
      const username = e.target.value.trim();
      const status = document.getElementById("user-status");

      if (username.length < 4) {
        if (status) status.innerText = "";
        return;
      }

      clearTimeout(userTimer);
      userTimer = setTimeout(async () => {
        if (status) status.innerText = "...";
        const payload = {
          username,
          brand_id: "31",
          timestamp: Math.floor(Date.now() / 1000).toString(),
        };
        try {
          const res = await fetch("https://winner247.co/username-check.php", {
            method: "POST",
            body: JSON.stringify({ params: encrypt(payload, USER_KEY) }),
          });
          const data = await res.json();
          if (status) {
            status.innerText = data?.message?.is_username_exists
              ? "Taken"
              : "Available";
            status.style.color = data?.message?.is_username_exists
              ? "#ff4d4d"
              : "#2ecc71";
          }
        } catch (e) {
          if (status) status.innerText = "";
        }
      }, 600);
    });
  }

  function startOtpTimer() {
    let timeLeft = 70;
    const timerElement = document.getElementById("y-timer");
    if (otpInterval) clearInterval(otpInterval);
    otpInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(otpInterval);
        if (timerElement) timerElement.parentElement.innerText = "OTP Expired.";
      } else {
        if (timerElement) timerElement.innerText = timeLeft;
        timeLeft -= 1;
      }
    }, 1000);
  }

  // 2. GET OTP
  const getOtpBtn = document.getElementById("y-get-otp");
  if (getOtpBtn) {
    getOtpBtn.addEventListener("click", function () {
      const mobile = document.getElementById("y-mobile").value.trim();
      if (mobile.length < 7) return alert("Enter valid number");

      const payload = {
        phoneNumber: mobile,
        phoneCountry: document.getElementById("y-country").value,
        brandId: 31,
      };

      const body = new FormData();
      body.append("action", "yolo_proxy");
      body.append("type", "otp");
      body.append("payload", encrypt(payload, OTP_KEY));

      fetch(yolo_settings.ajax_url, { method: "POST", body })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            document.getElementById("step-1").style.display = "none";
            document.getElementById("step-2").style.display = "block";
            startOtpTimer();
          } else {
            alert(data.message || "Failed");
          }
        });
    });
  }

  // 3. SUBMIT
  const submitBtn = document.getElementById("y-submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      const payload = {
        userName: document.getElementById("y-user").value.trim(),
        phoneNumber: document.getElementById("y-mobile").value.trim(),
        password: document.getElementById("y-pass").value.trim(),
        otpCode: document.getElementById("y-otp").value.trim(),
        phoneCountry: document.getElementById("y-country").value,
        brandId: 31,
      };

      const body = new FormData();
      body.append("action", "yolo_proxy");
      body.append("type", "register");
      body.append("payload", encrypt(payload, OTP_KEY));

      fetch(yolo_settings.ajax_url, { method: "POST", body })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (otpInterval) clearInterval(otpInterval);
            alert("Registration Successful!");
            window.location.href = "https://www.yolo247.site/login";
          } else {
            alert(data.message || "Failed");
          }
        });
    });
  }
});
