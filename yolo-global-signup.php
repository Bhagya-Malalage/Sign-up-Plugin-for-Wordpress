<?php
/**
 * Plugin Name: Yolo Global OTP Signup
 * Description: Global registration overlay with OTP and AES encryption.
 * Version: 1.4
 */

if ( ! defined( 'ABSPATH' ) ) exit;

add_shortcode('yolo_signup', 'yolo_render_form');

function yolo_render_form() {
    wp_enqueue_style('yolo-style', plugins_url('assets/style.css', __FILE__));
    wp_enqueue_script('crypto-js', 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js', [], null, true);
    wp_enqueue_script('yolo-script', plugins_url('assets/script.js', __FILE__), ['crypto-js'], null, true);

    wp_localize_script('yolo-script', 'yolo_settings', [
        'ajax_url' => admin_url('admin-ajax.php')
    ]);

    ob_start(); ?>
    <div id="yolo-signup-overlay" class="yolo-overlay-wrapper">
        <div class="yolo-card">
            <button type="button" class="yolo-close-overlay" onclick="document.getElementById('yolo-signup-overlay').style.display='none'">×</button>
            
            <img src="<?php echo plugins_url('assets/yolo-logo.png', __FILE__); ?>" class="yolo-logo-popup" alt="YOLO247">
            <h2 class="yolo-title">SIGN UP</h2>
            
            <div id="step-1">
                <div class="yolo-input-group">
                    <input type="text" id="y-user" placeholder="Create Username" autocomplete="off">
                    <span id="user-status"></span>
                </div>
                <input type="password" id="y-pass" placeholder="Create Password">
                
                <div class="yolo-phone-row">
                    <div class="yolo-phone-prefix">IN +91</div>
                    <input type="hidden" id="y-country" value="in">
                    <input type="tel" id="y-mobile" placeholder="Mobile Number">
                </div>
                <button type="button" id="y-get-otp" class="yolo-btn-main">GET OTP</button>
            </div>

            <div id="step-2" style="display:none;">
                <div id="yolo-timer-container" class="yolo-timer-msg">
                    Time remaining: <span id="y-timer">70</span>s
                </div>
                
                <div id="yolo-resend-container" style="display:none; margin-bottom: 15px;">
                    <button type="button" id="y-resend-otp" class="yolo-resend-link">Resend OTP</button>
                </div>
                
                <input type="text" id="y-otp" placeholder="Verify OTP">
                <div class="yolo-name-row">
                    <input type="text" id="y-fname" placeholder="First Name">
                    <input type="text" id="y-lname" placeholder="Last Name">
                </div>
                <button type="button" id="y-submit" class="yolo-btn-main">SUBMIT</button>
            </div>
            
            <p class="yolo-footer-note">JOIN TO UNLOCK FULL LIBRARY</p>
        </div>
    </div>
    <?php return ob_get_clean();
}

add_action('wp_ajax_nopriv_yolo_proxy', 'yolo_handle_proxy');
add_action('wp_ajax_yolo_proxy', 'yolo_handle_proxy');

function yolo_handle_proxy() {
    $type = isset($_POST['type']) ? sanitize_text_field($_POST['type']) : '';
    $payload = isset($_POST['payload']) ? sanitize_text_field($_POST['payload']) : '';

    $url = ($type === 'otp') 
        ? "https://affiliate1.bbb365.link/user/send-otp" 
        : "https://affiliate1.bbb365.link/user/user-register";

    $response = wp_remote_post($url, [
        'headers' => [
            'Content-Type' => 'application/json',
            'Origin'       => 'https://winner247.co',
            'Referer'      => 'https://winner247.co/'
        ],
        'body' => json_encode(['registerInfo' => $payload]),
        'timeout' => 30
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Network error. Please try again.']);
    }

    // Proxy returns the exact JSON body from the backend so JS can read the error message
    echo wp_remote_retrieve_body($response);
    wp_die();
}