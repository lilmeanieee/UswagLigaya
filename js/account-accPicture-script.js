//add account 
document.getElementById("profileImage").addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("profilePreview").src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  

//edit acc
document.getElementById("editProfileImage").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
          document.getElementById("editProfilePreview").src = e.target.result;
      };
      reader.readAsDataURL(file);
  }
});