// 1. Define a standard function (no 'new' keyword)
const checkEven = (val) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      val % 2 === 0 ? resolve("success") : reject("error");
    }, 1000);
  });
};

// 2. Define your logger function
const logger = (str) => {
  console.log(str);
};

// 3. Proper Execution
// Promises are handled using .then() and .catch()
checkEven(2)
  .then(logger)  // Runs logger("success") if resolved
  .catch(logger); // Runs logger("error") if rejected

  