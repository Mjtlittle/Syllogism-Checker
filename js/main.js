let categories = [];

let premise_1;
let premise_2;
let conclusion;

let tests_result_element;

let all_statements = [];
let all_premises = [];

let all_tests = [];

let passed_color = '#008800';
let failed_color = '#880000';

function format_set(set) {
    if (set.size == 0) {
        return 'none';
    } else {
        return Array.from(set).join(', ');
    }
}

class CategoricalStatement {

    constructor(id_prefix) {
        
        this.quantity_element = document.getElementById(id_prefix + '_quantity');
        this.subject_element = document.getElementById(id_prefix + '_subject');
        this.quality_element = document.getElementById(id_prefix + '_quality');
        this.predicate_element = document.getElementById(id_prefix + '_predicate');
        this.info_element = document.getElementById(id_prefix + '_info');

        this.all_changeable_elements = [this.quantity_element, this.subject_element, this.quality_element, this.predicate_element];

        // update the statement if any of the elements change
        this.all_changeable_elements.map((element) => {
            element.addEventListener('change', this.update.bind(this));
        })

        this.quantity = null;
        this.quality = null;
        this.short_hand_type = null;
        this.alt_short_hand_type = null;

        this.distributed = null;
        
        this.subject = null;
        this.predicate = null;

    }

    update_info() {
        this.info_element.innerText = `${this.quantity} ${this.quality} (${this.short_hand_type} / ${this.alt_short_hand_type}) | Distributed: ${format_set(this.distributed)}`;
    }

    update() {
        this.quantity = this.quantity_element.value == 'All' ? 'Universal' : 'Particular';
        this.quality = this.quality_element.value == 'are' ? 'Affirmative' : 'Negative';
        
        this.short_hand_type = this.quantity[0] + this.quality[0];
        
        // alternative more academic shorthand
        this.alt_short_hand_type = {
            'UA': 'SaP',
            'UN': 'SeP',
            'PA': 'SiP',
            'PN': 'SoP',
        }[this.short_hand_type];

        this.subject = this.subject_element.value;
        this.predicate = this.predicate_element.value;
        
        // get the list of distributed for the statement
        this.distributed = new Set();
        if (this.quantity == 'Universal') {
            this.distributed.add(this.subject);
        }
        if (this.quality == 'Negative') {
            this.distributed.add(this.predicate);
        }

        this.update_info();
    }

}

class ValidityTest {
    constructor(id_prefix, lambda) {
        this.result_element = document.getElementById(id_prefix + '_result');
        this.details_element = document.getElementById(id_prefix + '_details');
        this.lambda = lambda;
    }

    check(premises, conclusion) {
        let [result, details] = this.lambda(premises, conclusion);
        this.set_details(details);
        if (result) {
            this.set_passed();
        } else {
            this.set_failed();
        }
        return result;
    }

    set_details(text) {
        this.details_element.innerText = text;
    }

    set_passed() {
        this.result_element.style.color = passed_color;
        this.result_element.innerText = 'Passed';
    }

    set_failed() {
        this.result_element.style.color = failed_color;
        this.result_element.innerText = 'Failed';
    }
}

function update_statement_categories(){

    // place the categories from the list into the drop downs
    let option_elements;
    categories.map((category_element, index) => {
        option_elements = document.getElementsByClassName('category_' + (index + 1));
        for (option_element of option_elements) {
            option_element.innerText = category_element.value;
        }
    })
    
}

function update_all_statements(){
    all_statements.map((statement) => {
        statement.update();
    });
}

function check_all_tests() {

    let test_pass_count = 0;
    let result;
    all_tests.map((test, index) => {
        result = test.check(all_premises, conclusion);
        if (result) {
            test_pass_count += 1;
        }
    });

    // if all of the tests pass
    if (test_pass_count == all_tests.length){
        tests_result_element.style.color = passed_color;
        tests_result_element.innerText = 'Syllogism is Valid';
    } else {
        tests_result_element.style.color = failed_color;
        tests_result_element.innerText = 'Syllogism is Invalid';
    }
}

function update_everything() {
    update_statement_categories();
    update_all_statements();
    check_all_tests();
}

// when the dom is loaded
document.addEventListener("DOMContentLoaded", () => {

    // get all part elements and register update event
    let element;
    for(let i = 1; i <= 3; i++){
        element = document.getElementById('part_'+i);
        element.addEventListener('change', update_everything);
        categories.push(element);
    }

    premise_1 = new CategoricalStatement('premise_1');
    premise_2 = new CategoricalStatement('premise_2');
    conclusion = new CategoricalStatement('conclusion');

    tests_result_element = document.getElementById('tests_result');

    all_statements = [premise_1, premise_2, conclusion];
    all_premises = [premise_1, premise_2];

    // register all of the change events for the statements
    all_statements.map((statement) => {
        statement.all_changeable_elements.map((element) => {
            element.addEventListener('change', check_all_tests);
        })
    });

    all_tests = [];
    all_tests.push(new ValidityTest('equal_negatives', (prems, conc) => {
        
        premise_negative_count = 0;
        prems.map((premise) => {
            if (premise.quality == 'Negative'){
                premise_negative_count += 1;
            }
        })

        conclusion_negative_count = (conc.quality == 'Negative') ? 1 : 0;

        if (conclusion_negative_count == premise_negative_count) {
            return [true, ''];
        } else {
            return [false, ''];
        }
    }));
    all_tests.push(new ValidityTest('quantity', (prems, conc) => {
        
        // if both premises are the same then the conclusion must also be the same
        all_premises_same = prems.every( (premise, i, arr) => premise.quantity === arr[0].quantity);

        if (all_premises_same) {
            
            if (prems[0].quantity == conc.quantity) {
                return [true, `The test passes because the conclusion has the same quantity, ${conc.quantity}, as all of the premises.`];
            } else {
                return [false, `The test fails because the conclusion has a different quantity, ${conc.quantity}, than the premises, ${prems[0].quantity}.`];
            }
        
        // otherwise the test does not apply and passes
        } else {
            return [true, 'This test passes, because all of the premieses do not have the same quantity.'];
        }

    }));
    all_tests.push(new ValidityTest('distributed_conclusion', (prems, conc) => {
        
        // get all distributed categories in the premieses
        let premise_categories_disted = new Set();
        prems.map((premise) => {
            premise.distributed.forEach((category) => {premise_categories_disted.add(category)});
        });
        
        // check if all of the categories distributed by the conclusion are disted. in the premises
        return [[...conc.distributed].every((category) => premise_categories_disted.has(category)), ''];

    }));
    all_tests.push(new ValidityTest('distributed_middle', (prems, conc) => {

        let premise_categories_disted = new Set();
        let all_categories = new Set();
        prems.map((premise) => {
            
            // get all distributed categories in the premieses
            premise.distributed.forEach((category) => {premise_categories_disted.add(category)});

            // get all categories in premises
            all_categories.add(premise.subject);
            all_categories.add(premise.predicate);
        });

        // if there is no middle, premise is invalid
        if (all_categories.size <= 2) {
            return [false, 'The test is undefined for this situation, because there are less than or equal to two categories used in the premise, and in turn no middle group.'];
        }

        // remove categories from conclusion till middle is left
        let middle_category = all_categories;
        middle_category.delete(conc.subject);
        middle_category.delete(conc.predicate);

        // return whether all of the middle categories are distributed in the premises
        middle_category_distributed_in_all = Array.from(middle_category).every((category) => premise_categories_disted.has(category))
        if (middle_category_distributed_in_all) {
            return [true, `The test passes because the middle category, ${middle_category.values().next().value}, is distributed in at least one of the premises.`]
        } else {
            return [false, `The test fails because the middle category, ${middle_category.values().next().value}, is not distributed in at least one of the premises.`]
        }
    }));

    update_everything();
});