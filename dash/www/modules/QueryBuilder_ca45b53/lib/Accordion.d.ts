declare namespace Accordion {
    class AccordionView {
        sections: Section[];
        constructor(options: any): void;
        addSection(section: any, updateLayout: boolean): void;
        removeSection(id: string): void;
        resize(): void;
        setDirection(direction: string): void;
        updateLayout(animate?: boolean): void;
    }

    interface Section {
        $cel?: JQuery;
        $el: JQuery;
        $hel?: JQuery;
        $tel?: JQuery;
        viewModel: Backbone.Model;
    }
}
