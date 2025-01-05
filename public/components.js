const addNavbarUtility = () => {
    const firstName = localStorage.getItem('firstName');
    const lastName = localStorage.getItem('lastName');
    const profilePhoto = localStorage.getItem('profilePhoto') || 'Photo/default-profile.jpg';

    const header = document.getElementsByClassName('header')[0];
    const navbar = document.createElement('nav');
    navbar.id = 'navbar';
    header.appendChild(navbar);

    if (firstName && lastName) {
        /*navBar.innerHTML = `
            <div class="user-info" onclick="goToProfile()">
                <img src="${profilePhoto}" alt="Profile">
                <span>${firstName} ${lastName}</span>
            </div>
        `;
        */
        navbar.innerHTML = `
            <a href="profile.html">Profile</a>
            <a href="signOut.html">Sign Out</a>
        `;
    } else {
        navbar.innerHTML = `
            <a href="register.html">Register</a>
            <a href="signin.html">Sign In</a>
        `;
    }
}