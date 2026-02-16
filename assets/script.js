document.addEventListener("DOMContentLoaded", function () {
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

  function openYoloSignup() {
    if (overlay) overlay.style.display = "flex";
  }

  document.addEventListener("click", function (e) {
    const isTriggerClass = e.target.closest(".yolo-trigger");
    const isAuthBtn =
      (e.target.tagName === "BUTTON" || e.target.tagName === "A") &&
      /signup|sign up|login|register/i.test(e.target.innerText);

    if (isTriggerClass || isAuthBtn) {
      if (e.target.closest(".yolo-card")) return;
      e.preventDefault();
      openYoloSignup();
    }
  });

  // 1. Username Check
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
    const timerContainer = document.getElementById("yolo-timer-container");
    const resendContainer = document.getElementById("yolo-resend-container");

    if (resendContainer) resendContainer.style.display = "none";
    timerContainer.innerHTML = 'Time remaining: <span id="y-timer">70</span>s';

    const timerSpan = document.getElementById("y-timer");

    if (otpInterval) clearInterval(otpInterval);

    otpInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(otpInterval);
        timerContainer.innerText = "OTP Expired.";
        if (resendContainer) resendContainer.style.display = "block";
      } else {
        timeLeft -= 1;
        if (timerSpan) timerSpan.innerText = timeLeft;
      }
    }, 1000);
  }

  // 2. Request OTP
  async function requestOTP(buttonElement) {
    const mobile = document.getElementById("y-mobile").value.trim();
    if (mobile.length < 7) return alert("Please enter a valid mobile number.");

    const payload = {
      phoneNumber: mobile,
      phoneCountry: document.getElementById("y-country").value || "in",
      brandId: 31,
    };

    const originalText = buttonElement.innerText;
    buttonElement.innerText = "Sending...";
    buttonElement.disabled = true;

    const body = new FormData();
    body.append("action", "yolo_proxy");
    body.append("type", "otp");
    body.append("payload", encrypt(payload, OTP_KEY));

    try {
      const res = await fetch(yolo_settings.ajax_url, { method: "POST", body });
      const data = await res.json();

      if (data.success) {
        document.getElementById("step-1").style.display = "none";
        document.getElementById("step-2").style.display = "block";
        startOtpTimer();
      } else {
        const msg = (data.message || "").toLowerCase();
        if (
          msg.includes("exists") ||
          msg.includes("registered") ||
          msg.includes("already")
        ) {
          alert(
            "This phone number is already registered. Please login or use a different number.",
          );
        } else {
          alert(data.message || "Failed to send OTP.");
        }
      }
    } catch (e) {
      alert("Network Error.");
    } finally {
      buttonElement.innerText = originalText;
      buttonElement.disabled = false;
    }
  }

  const getOtpBtn = document.getElementById("y-get-otp");
  if (getOtpBtn)
    getOtpBtn.addEventListener("click", () => requestOTP(getOtpBtn));

  const resendBtn = document.getElementById("y-resend-otp");
  if (resendBtn)
    resendBtn.addEventListener("click", () => requestOTP(resendBtn));

  // 3. FINAL SUBMIT
  const submitBtn = document.getElementById("y-submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", function () {
      const otpVal = document.getElementById("y-otp").value.trim();
      if (!otpVal) return alert("Please enter the OTP code.");

      // STRICT PAYLOAD MATCHING DOCUMENTATION
      const payload = {
        userName: document.getElementById("y-user").value.trim(),
        phoneNumber: document.getElementById("y-mobile").value.trim(),
        password: document.getElementById("y-pass").value.trim(),
        otpCode: otpVal,
        phoneCountry: document.getElementById("y-country").value || "in",
        marketingSource: "",
        brandId: 31,
        clickid: "",
        fsource: "",
        voluum_click_id: "",
      };

      const body = new FormData();
      body.append("action", "yolo_proxy");
      body.append("type", "register");
      body.append("payload", encrypt(payload, OTP_KEY));

      submitBtn.innerText = "Processing...";
      submitBtn.disabled = true;

      fetch(yolo_settings.ajax_url, { method: "POST", body })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (otpInterval) clearInterval(otpInterval);
            alert("Registration Successful!");
            window.location.href = "https://www.yolo247.site/login";
          } else {
            // Better alert for user
            alert(
              data.message ||
                "Registration failed. Your OTP might be incorrect or expired.",
            );
          }
        })
        .catch(() => alert("Server error. Please try again."))
        .finally(() => {
          submitBtn.innerText = "SUBMIT";
          submitBtn.disabled = false;
        });
    });
  }
});
