import type { Schema, Attribute } from "@strapi/strapi";

export interface PortfolioHero extends Schema.Component {
    collectionName: "components_portfolio_heroes";
    info: {
        displayName: "hero";
    };
    attributes: {
        subTitle: Attribute.Text;
        buttonText: Attribute.String;
    };
}

export interface PortfolioCeo extends Schema.Component {
    collectionName: "components_portfolio_ceos";
    info: {
        displayName: "ceo";
        description: "";
    };
    attributes: {
        position: Attribute.String;
        fullName: Attribute.String;
        text: Attribute.Text;
        ava: Attribute.Media<"images" | "files" | "videos" | "audios">;
    };
}

export interface HomepageOurCoreValues extends Schema.Component {
    collectionName: "components_homepage_our_core_values";
    info: {
        displayName: "our-core-values";
    };
    attributes: {
        subTitle: Attribute.String;
        ourCoreValuesCard: Attribute.Component<
            "homepage.our-core-values-card",
            true
        >;
    };
}

export interface HomepageOurCoreValuesCard extends Schema.Component {
    collectionName: "components_homepage_our_core_values_cards";
    info: {
        displayName: "our-core-values-card";
    };
    attributes: {
        title: Attribute.String;
        text: Attribute.Text;
    };
}

export interface HomepageHowWeWork extends Schema.Component {
    collectionName: "components_homepage_how_we_works";
    info: {
        displayName: "how-we-work";
    };
    attributes: {};
}

export interface HomepageHowWeWorkCard extends Schema.Component {
    collectionName: "components_homepage_how_we_work_cards";
    info: {
        displayName: "how-we-work-card";
    };
    attributes: {
        title: Attribute.String;
        cardTextList: Attribute.Component<"homepage.card-text-list", true>;
    };
}

export interface HomepageHero extends Schema.Component {
    collectionName: "components_homepage_heroes";
    info: {
        displayName: "Hero";
        description: "";
    };
    attributes: {
        subTitle: Attribute.Text;
        buttonText: Attribute.String;
    };
}

export interface HomepageFrequentlyAskedQuestionCard extends Schema.Component {
    collectionName: "components_homepage_frequently_asked_question_cards";
    info: {
        displayName: "frequently-asked-questions-card";
        description: "";
    };
    attributes: {
        title: Attribute.String;
        text: Attribute.Text;
    };
}

export interface HomepageExploreWithIteam extends Schema.Component {
    collectionName: "components_homepage_explore_with_iteams";
    info: {
        displayName: "explore-with-iteam";
    };
    attributes: {
        subTitle: Attribute.String;
        exploreWithIteamCard: Attribute.Component<
            "homepage.explore-with-iteam-card",
            true
        >;
    };
}

export interface HomepageExploreWithIteamCard extends Schema.Component {
    collectionName: "components_homepage_explore_with_iteam_cards";
    info: {
        displayName: "explore-with-iteam-card";
        description: "";
    };
    attributes: {
        subTitle: Attribute.Text;
        country: Attribute.String;
        money: Attribute.Integer;
        buttonText: Attribute.String;
    };
}

export interface HomepageCard extends Schema.Component {
    collectionName: "components_homepage_cards";
    info: {
        displayName: "Card";
    };
    attributes: {
        title: Attribute.String;
    };
}

export interface HomepageCardTextList extends Schema.Component {
    collectionName: "components_homepage_card_text_lists";
    info: {
        displayName: "card-text-list";
    };
    attributes: {
        text: Attribute.Text;
    };
}

export interface HomepageBookForm extends Schema.Component {
    collectionName: "components_homepage_book_forms";
    info: {
        displayName: "book-form";
    };
    attributes: {
        subTitle: Attribute.String;
        inputPlaceholder: Attribute.String;
        buttonText: Attribute.String;
    };
}

export interface AboutUsTeamMember extends Schema.Component {
    collectionName: "components_about_us_team_members";
    info: {
        displayName: "teamMember";
    };
    attributes: {
        ava: Attribute.Media<"images" | "files" | "videos" | "audios">;
    };
}

export interface AboutUsTeamCards extends Schema.Component {
    collectionName: "components_about_us_team_cards";
    info: {
        displayName: "teamCards";
    };
    attributes: {
        title: Attribute.String;
        member: Attribute.Component<"about-us.team-member", true>;
    };
}

export interface AboutUsHero extends Schema.Component {
    collectionName: "components_about_us_heroes";
    info: {
        displayName: "hero";
    };
    attributes: {
        subTitle: Attribute.Text;
        buttonText: Attribute.String;
    };
}

export interface AboutUsComments extends Schema.Component {
    collectionName: "components_about_us_comments";
    info: {
        displayName: "comments";
    };
    attributes: {
        title: Attribute.String;
        commentInfo: Attribute.Component<"about-us.comment-info", true>;
    };
}

export interface AboutUsCommentInfo extends Schema.Component {
    collectionName: "components_about_us_comment_infos";
    info: {
        displayName: "comment-info";
        description: "";
    };
    attributes: {
        text: Attribute.Text;
        author: Attribute.String;
        link: Attribute.String;
    };
}

export interface HeaderFooterSocialMedia extends Schema.Component {
    collectionName: "components_header_footer_social_medias";
    info: {
        displayName: "social-media";
    };
    attributes: {
        href: Attribute.String;
        icon: Attribute.Media<"images" | "files" | "videos" | "audios">;
    };
}

export interface HeaderFooterOptions extends Schema.Component {
    collectionName: "components_header_footer_options";
    info: {
        displayName: "options";
    };
    attributes: {
        option: Attribute.String;
        href: Attribute.Enumeration<["/outstaff", "/outsource"]>;
    };
}

export interface HeaderFooterHeader extends Schema.Component {
    collectionName: "components_header_footer_headers";
    info: {
        displayName: "header";
    };
    attributes: {
        title: Attribute.String;
        options: Attribute.Component<"header-footer.options", true>;
        href: Attribute.String;
    };
}

export interface HeaderFooterHeaderButton extends Schema.Component {
    collectionName: "components_header_footer_header_buttons";
    info: {
        displayName: "header-button";
    };
    attributes: {
        title: Attribute.String;
    };
}

export interface HeaderFooterFooterInfo extends Schema.Component {
    collectionName: "components_header_footer_footer_infos";
    info: {
        displayName: "footer-info";
    };
    attributes: {
        title: Attribute.String;
        footerInfoText: Attribute.Component<
            "header-footer.footer-info-text",
            true
        >;
    };
}

export interface HeaderFooterFooterInfoText extends Schema.Component {
    collectionName: "components_header_footer_footer_info_texts";
    info: {
        displayName: "footer-info-text";
        description: "";
    };
    attributes: {
        linkText: Attribute.String;
        href: Attribute.String;
    };
}

declare module "@strapi/types" {
    export module Shared {
        export interface Components {
            "portfolio.hero": PortfolioHero;
            "portfolio.ceo": PortfolioCeo;
            "homepage.our-core-values": HomepageOurCoreValues;
            "homepage.our-core-values-card": HomepageOurCoreValuesCard;
            "homepage.how-we-work": HomepageHowWeWork;
            "homepage.how-we-work-card": HomepageHowWeWorkCard;
            "homepage.hero": HomepageHero;
            "homepage.frequently-asked-question-card": HomepageFrequentlyAskedQuestionCard;
            "homepage.explore-with-iteam": HomepageExploreWithIteam;
            "homepage.explore-with-iteam-card": HomepageExploreWithIteamCard;
            "homepage.card": HomepageCard;
            "homepage.card-text-list": HomepageCardTextList;
            "homepage.book-form": HomepageBookForm;
            "about-us.team-member": AboutUsTeamMember;
            "about-us.team-cards": AboutUsTeamCards;
            "about-us.hero": AboutUsHero;
            "about-us.comments": AboutUsComments;
            "about-us.comment-info": AboutUsCommentInfo;
            "header-footer.social-media": HeaderFooterSocialMedia;
            "header-footer.options": HeaderFooterOptions;
            "header-footer.header": HeaderFooterHeader;
            "header-footer.header-button": HeaderFooterHeaderButton;
            "header-footer.footer-info": HeaderFooterFooterInfo;
            "header-footer.footer-info-text": HeaderFooterFooterInfoText;
        }
    }
}
