import type { Schema, Attribute } from '@strapi/strapi';

export interface TestReferenceCategory extends Schema.Component {
  collectionName: 'components_test_reference_categories';
  info: {
    displayName: 'ReferenceCategory';
  };
  attributes: {
    name: Attribute.String;
  };
}

export interface TestExisitngTitles extends Schema.Component {
  collectionName: 'components_test_exisitng_titles';
  info: {
    displayName: 'ExisitngTitles';
  };
  attributes: {
    name: Attribute.String;
  };
}

export interface TestCommentInfo extends Schema.Component {
  collectionName: 'components_test_comment_infos';
  info: {
    displayName: 'CommentInfo';
    description: '';
  };
  attributes: {
    sometext: Attribute.String;
  };
}

export interface TestBannedCategory extends Schema.Component {
  collectionName: 'components_test_banned_categories';
  info: {
    displayName: 'BannedCategory';
  };
  attributes: {
    name: Attribute.String;
  };
}

export interface ServicesQuote extends Schema.Component {
  collectionName: 'components_services_quotes';
  info: {
    displayName: 'quote';
  };
  attributes: {
    text: Attribute.JSON;
  };
}

export interface ServicesProsList extends Schema.Component {
  collectionName: 'components_services_pros_lists';
  info: {
    displayName: 'prosList';
  };
  attributes: {
    text: Attribute.Text;
  };
}

export interface ServicesProjectCases extends Schema.Component {
  collectionName: 'components_services_project_cases';
  info: {
    displayName: 'projectCases';
  };
  attributes: {
    projectId: Attribute.String;
    imageLink: Attribute.Text;
    title: Attribute.String;
    description: Attribute.String;
    caseFlag: Attribute.String;
  };
}

export interface ServicesImages extends Schema.Component {
  collectionName: 'components_services_images';
  info: {
    displayName: 'images';
    description: '';
  };
  attributes: {
    url: Attribute.Text;
  };
}

export interface ServicesFoldersImage extends Schema.Component {
  collectionName: 'components_services_folders_images';
  info: {
    displayName: 'FoldersImage';
  };
  attributes: {
    url: Attribute.Text;
  };
}

export interface ServicesFolder extends Schema.Component {
  collectionName: 'components_services_folders';
  info: {
    displayName: 'Folder';
    description: '';
  };
  attributes: {
    subtitle: Attribute.String & Attribute.Required;
    buttonTitle: Attribute.String & Attribute.Required;
    promoTitle: Attribute.String;
    promoNumber: Attribute.String;
    prosList: Attribute.Component<'services.pros-list', true>;
    foldersImage: Attribute.Component<'services.folders-image', true>;
  };
}

export interface ServicesFirstProsList extends Schema.Component {
  collectionName: 'components_services_first_pros_lists';
  info: {
    displayName: 'FirstProsList';
    description: '';
  };
  attributes: {
    text: Attribute.String;
    title: Attribute.Component<'services.comment-info', true>;
  };
}

export interface ServicesCommentInfo extends Schema.Component {
  collectionName: 'components_services_comment_infos';
  info: {
    displayName: 'CommentInfo';
  };
  attributes: {
    test: Attribute.JSON;
  };
}

export interface ServicesAdvantageCircles extends Schema.Component {
  collectionName: 'components_services_advantage_circles';
  info: {
    displayName: 'advantage-circles';
  };
  attributes: {
    title: Attribute.String;
    hiddenText: Attribute.String;
  };
}

export interface PortfolioHero extends Schema.Component {
  collectionName: 'components_portfolio_heroes';
  info: {
    displayName: 'hero';
  };
  attributes: {
    subTitle: Attribute.Text;
    buttonText: Attribute.String;
  };
}

export interface PortfolioCeo extends Schema.Component {
  collectionName: 'components_portfolio_ceos';
  info: {
    displayName: 'ceo';
    description: '';
  };
  attributes: {
    position: Attribute.String;
    fullName: Attribute.String;
    imageUrl: Attribute.Text;
    quote: Attribute.Text;
  };
}

export interface HomepageTech extends Schema.Component {
  collectionName: 'components_homepage_teches';
  info: {
    displayName: 'tech';
  };
  attributes: {
    iconName: Attribute.String;
    label: Attribute.String;
  };
}

export interface HomepageSlider extends Schema.Component {
  collectionName: 'components_homepage_sliders';
  info: {
    displayName: 'Slider';
    description: '';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    description: Attribute.Text & Attribute.Required;
    location: Attribute.String;
    budget: Attribute.Integer;
    technologies: Attribute.Component<'homepage.tech', true>;
    appLink: Attribute.Text;
    projectId: Attribute.String;
    imageUrl: Attribute.String;
  };
}

export interface HomepageOurCoreValues extends Schema.Component {
  collectionName: 'components_homepage_our_core_values';
  info: {
    displayName: 'our-core-values';
  };
  attributes: {
    subTitle: Attribute.String;
    ourCoreValuesCard: Attribute.Component<
      'homepage.our-core-values-card',
      true
    >;
  };
}

export interface HomepageOurCoreValuesCard extends Schema.Component {
  collectionName: 'components_homepage_our_core_values_cards';
  info: {
    displayName: 'our-core-values-card';
  };
  attributes: {
    title: Attribute.String;
    text: Attribute.Text;
  };
}

export interface HomepageHowWeWork extends Schema.Component {
  collectionName: 'components_homepage_how_we_works';
  info: {
    displayName: 'how-we-work';
  };
  attributes: {};
}

export interface HomepageHowWeWorkComponent extends Schema.Component {
  collectionName: 'components_homepage_how_we_work_components';
  info: {
    displayName: 'howWeWorkComponent';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
  };
}

export interface HomepageHowWeWorkCard extends Schema.Component {
  collectionName: 'components_homepage_how_we_work_cards';
  info: {
    displayName: 'how-we-work-card';
  };
  attributes: {
    title: Attribute.String;
    cardTextList: Attribute.Component<'homepage.card-text-list', true>;
  };
}

export interface HomepageHero extends Schema.Component {
  collectionName: 'components_homepage_heroes';
  info: {
    displayName: 'Hero';
    description: '';
  };
  attributes: {
    subTitle: Attribute.Text;
    buttonText: Attribute.String;
  };
}

export interface HomepageFrequentlyAskedQuestionCard extends Schema.Component {
  collectionName: 'components_homepage_frequently_asked_question_cards';
  info: {
    displayName: 'frequently-asked-questions-card';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    text: Attribute.Text;
  };
}

export interface HomepageFaq extends Schema.Component {
  collectionName: 'components_homepage_faqs';
  info: {
    displayName: 'faq';
  };
  attributes: {
    title: Attribute.Text;
    description: Attribute.Text;
  };
}

export interface HomepageExploreWithIteam extends Schema.Component {
  collectionName: 'components_homepage_explore_with_iteams';
  info: {
    displayName: 'explore-with-iteam';
  };
  attributes: {
    subTitle: Attribute.String;
    exploreWithIteamCard: Attribute.Component<
      'homepage.explore-with-iteam-card',
      true
    >;
  };
}

export interface HomepageExploreWithIteamCard extends Schema.Component {
  collectionName: 'components_homepage_explore_with_iteam_cards';
  info: {
    displayName: 'explore-with-iteam-card';
    description: '';
  };
  attributes: {
    subTitle: Attribute.Text;
    country: Attribute.String;
    money: Attribute.Integer;
    buttonText: Attribute.String;
  };
}

export interface HomepageCoreValues extends Schema.Component {
  collectionName: 'components_homepage_core_values';
  info: {
    displayName: 'coreValues';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    subtitle: Attribute.Text & Attribute.Required;
  };
}

export interface HomepageCoreSection extends Schema.Component {
  collectionName: 'components_homepage_core_sections';
  info: {
    displayName: 'coreSection';
  };
  attributes: {
    subtitle: Attribute.Text;
    coreValues: Attribute.Component<'homepage.core-values', true>;
  };
}

export interface HomepageCard extends Schema.Component {
  collectionName: 'components_homepage_cards';
  info: {
    displayName: 'Card';
  };
  attributes: {
    title: Attribute.String;
  };
}

export interface HomepageCardTextList extends Schema.Component {
  collectionName: 'components_homepage_card_text_lists';
  info: {
    displayName: 'card-text-list';
  };
  attributes: {
    text: Attribute.Text;
  };
}

export interface HomepageBookForm extends Schema.Component {
  collectionName: 'components_homepage_book_forms';
  info: {
    displayName: 'book-form';
  };
  attributes: {
    subTitle: Attribute.String;
    inputPlaceholder: Attribute.String;
    buttonText: Attribute.String;
  };
}

export interface HeaderFooterSocialMedia extends Schema.Component {
  collectionName: 'components_header_footer_social_medias';
  info: {
    displayName: 'social-media';
  };
  attributes: {
    href: Attribute.String;
    icon: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface HeaderFooterOptions extends Schema.Component {
  collectionName: 'components_header_footer_options';
  info: {
    displayName: 'options';
  };
  attributes: {
    option: Attribute.String;
    href: Attribute.Enumeration<['/outstaff', '/outsource']>;
  };
}

export interface HeaderFooterHeader extends Schema.Component {
  collectionName: 'components_header_footer_headers';
  info: {
    displayName: 'header';
  };
  attributes: {
    title: Attribute.String;
    options: Attribute.Component<'header-footer.options', true>;
    href: Attribute.String;
  };
}

export interface HeaderFooterHeaderButton extends Schema.Component {
  collectionName: 'components_header_footer_header_buttons';
  info: {
    displayName: 'header-button';
  };
  attributes: {
    title: Attribute.String;
  };
}

export interface HeaderFooterFooterInfo extends Schema.Component {
  collectionName: 'components_header_footer_footer_infos';
  info: {
    displayName: 'footer-info';
  };
  attributes: {
    title: Attribute.String;
    footerInfoText: Attribute.Component<'header-footer.footer-info-text', true>;
  };
}

export interface HeaderFooterFooterInfoText extends Schema.Component {
  collectionName: 'components_header_footer_footer_info_texts';
  info: {
    displayName: 'footer-info-text';
    description: '';
  };
  attributes: {
    linkText: Attribute.String;
    href: Attribute.String;
  };
}

export interface DevelopmentTechStack extends Schema.Component {
  collectionName: 'components_development_tech_stacks';
  info: {
    displayName: 'tech-stack';
  };
  attributes: {
    text: Attribute.String;
  };
}

export interface DevelopmentTechStackInfo extends Schema.Component {
  collectionName: 'components_development_tech_stack_infos';
  info: {
    displayName: 'tech-stack-info';
    description: '';
  };
  attributes: {
    buttonText: Attribute.String;
    subTitle: Attribute.Text;
    techStack: Attribute.Component<'development.tech-stack', true>;
  };
}

export interface ContactPros extends Schema.Component {
  collectionName: 'components_contact_pros';
  info: {
    displayName: 'pros';
  };
  attributes: {
    text: Attribute.String;
  };
}

export interface ContactContactInfo extends Schema.Component {
  collectionName: 'components_contact_contact_infos';
  info: {
    displayName: 'contact-info';
  };
  attributes: {
    phoneNumber: Attribute.String;
    email: Attribute.Email;
    address: Attribute.String;
  };
}

export interface ContactContactForm extends Schema.Component {
  collectionName: 'components_contact_contact_forms';
  info: {
    displayName: 'contact-form';
  };
  attributes: {
    buttonText: Attribute.String;
    subTitle: Attribute.Text;
    inputNamePlaceholder: Attribute.String;
    inputPhonePlaceholder: Attribute.String;
    inputEmailPlaceholder: Attribute.String;
    inputMessagePlaceholder: Attribute.String;
  };
}

export interface AdComponentsSeo extends Schema.Component {
  collectionName: 'components_ad_components_seos';
  info: {
    displayName: 'seo';
  };
  attributes: {
    title: Attribute.String;
    category: Attribute.Text;
    previewDescription: Attribute.Text;
    previewImage: Attribute.String;
  };
}

export interface AdComponentsInvitation extends Schema.Component {
  collectionName: 'components_ad_components_invitations';
  info: {
    displayName: 'invitation';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    text: Attribute.String;
    buttonLink: Attribute.String;
    buttonText: Attribute.String;
    downloadFile: Attribute.Component<'ad-components.download-file'>;
  };
}

export interface AdComponentsDownloadFile extends Schema.Component {
  collectionName: 'components_ad_components_download_files';
  info: {
    displayName: 'download-file';
    description: '';
  };
  attributes: {
    file: Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    buttonName: Attribute.String;
    title: Attribute.String;
    fileName: Attribute.String;
  };
}

export interface AdComponentsAdHero extends Schema.Component {
  collectionName: 'components_ad_components_ad_heroes';
  info: {
    displayName: 'ad-hero';
    description: '';
  };
  attributes: {
    image: Attribute.String &
      Attribute.DefaultTo<'https://i.ibb.co/b8F1tfW/image.png'>;
    title: Attribute.String;
    text: Attribute.String;
    buttonLink: Attribute.String;
    buttonText: Attribute.String;
  };
}

export interface AdComponentsAdGridElement extends Schema.Component {
  collectionName: 'components_ad_components_ad_grid_elements';
  info: {
    displayName: 'ad-grid-element';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    text: Attribute.String;
    icon: Attribute.String;
  };
}

export interface AdComponentsAdGridBlock extends Schema.Component {
  collectionName: 'components_ad_components_ad_grid_blocks';
  info: {
    displayName: 'ad-grid-block';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    elements: Attribute.Component<'ad-components.ad-grid-element', true>;
  };
}

export interface AdComponentsAdComments extends Schema.Component {
  collectionName: 'components_ad_components_ad_comments';
  info: {
    displayName: 'ad-comments';
  };
  attributes: {
    comments: Attribute.Component<'about-us.comments-info', true>;
  };
}

export interface AdComponentsAdCode extends Schema.Component {
  collectionName: 'components_ad_components_ad_codes';
  info: {
    displayName: 'ad-code';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    text: Attribute.Text;
    buttonText: Attribute.String;
    buttonLink: Attribute.String;
    code: Attribute.RichText;
    icons: Attribute.Component<'ad-components.ad-code-icon', true>;
    isCodeLong: Attribute.Boolean & Attribute.DefaultTo<false>;
  };
}

export interface AdComponentsAdCodeIcon extends Schema.Component {
  collectionName: 'components_ad_components_ad_code_icons';
  info: {
    displayName: 'ad-code-icon';
  };
  attributes: {
    iconName: Attribute.String;
    label: Attribute.String;
    name: Attribute.String;
    src: Attribute.String;
  };
}

export interface AdComponentsAdCase extends Schema.Component {
  collectionName: 'components_ad_components_ad_cases';
  info: {
    displayName: 'ad-case';
    description: '';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    location: Attribute.String;
    buttonLink: Attribute.String;
    buttonText: Attribute.String;
    image: Attribute.String;
    budget: Attribute.Integer;
    icons: Attribute.Component<'homepage.tech', true>;
  };
}

export interface AboutUsHero extends Schema.Component {
  collectionName: 'components_about_us_heroes';
  info: {
    displayName: 'hero';
    description: '';
  };
  attributes: {
    subTitle: Attribute.Text;
    buttonText: Attribute.String;
  };
}

export interface AboutUsDevelopmentTeamParticipants extends Schema.Component {
  collectionName: 'components_about_us_development_team_participants';
  info: {
    displayName: 'TeamParticipants';
    icon: '';
    description: '';
  };
  attributes: {
    experience: Attribute.String;
    rate: Attribute.String;
    expertise: Attribute.String;
    name: Attribute.String;
    role: Attribute.String;
    imageUrl: Attribute.Text;
    upWorkLink: Attribute.Text;
  };
}

export interface AboutUsCommentsInfo extends Schema.Component {
  collectionName: 'components_about_us_comments_infos';
  info: {
    displayName: 'Comment-info';
    description: '';
  };
  attributes: {
    text: Attribute.Text;
    author: Attribute.String;
    link: Attribute.String;
    rate: Attribute.Integer;
    linkTitle: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'test.reference-category': TestReferenceCategory;
      'test.exisitng-titles': TestExisitngTitles;
      'test.comment-info': TestCommentInfo;
      'test.banned-category': TestBannedCategory;
      'services.quote': ServicesQuote;
      'services.pros-list': ServicesProsList;
      'services.project-cases': ServicesProjectCases;
      'services.images': ServicesImages;
      'services.folders-image': ServicesFoldersImage;
      'services.folder': ServicesFolder;
      'services.first-pros-list': ServicesFirstProsList;
      'services.comment-info': ServicesCommentInfo;
      'services.advantage-circles': ServicesAdvantageCircles;
      'portfolio.hero': PortfolioHero;
      'portfolio.ceo': PortfolioCeo;
      'homepage.tech': HomepageTech;
      'homepage.slider': HomepageSlider;
      'homepage.our-core-values': HomepageOurCoreValues;
      'homepage.our-core-values-card': HomepageOurCoreValuesCard;
      'homepage.how-we-work': HomepageHowWeWork;
      'homepage.how-we-work-component': HomepageHowWeWorkComponent;
      'homepage.how-we-work-card': HomepageHowWeWorkCard;
      'homepage.hero': HomepageHero;
      'homepage.frequently-asked-question-card': HomepageFrequentlyAskedQuestionCard;
      'homepage.faq': HomepageFaq;
      'homepage.explore-with-iteam': HomepageExploreWithIteam;
      'homepage.explore-with-iteam-card': HomepageExploreWithIteamCard;
      'homepage.core-values': HomepageCoreValues;
      'homepage.core-section': HomepageCoreSection;
      'homepage.card': HomepageCard;
      'homepage.card-text-list': HomepageCardTextList;
      'homepage.book-form': HomepageBookForm;
      'header-footer.social-media': HeaderFooterSocialMedia;
      'header-footer.options': HeaderFooterOptions;
      'header-footer.header': HeaderFooterHeader;
      'header-footer.header-button': HeaderFooterHeaderButton;
      'header-footer.footer-info': HeaderFooterFooterInfo;
      'header-footer.footer-info-text': HeaderFooterFooterInfoText;
      'development.tech-stack': DevelopmentTechStack;
      'development.tech-stack-info': DevelopmentTechStackInfo;
      'contact.pros': ContactPros;
      'contact.contact-info': ContactContactInfo;
      'contact.contact-form': ContactContactForm;
      'ad-components.seo': AdComponentsSeo;
      'ad-components.invitation': AdComponentsInvitation;
      'ad-components.download-file': AdComponentsDownloadFile;
      'ad-components.ad-hero': AdComponentsAdHero;
      'ad-components.ad-grid-element': AdComponentsAdGridElement;
      'ad-components.ad-grid-block': AdComponentsAdGridBlock;
      'ad-components.ad-comments': AdComponentsAdComments;
      'ad-components.ad-code': AdComponentsAdCode;
      'ad-components.ad-code-icon': AdComponentsAdCodeIcon;
      'ad-components.ad-case': AdComponentsAdCase;
      'about-us.hero': AboutUsHero;
      'about-us.development-team-participants': AboutUsDevelopmentTeamParticipants;
      'about-us.comments-info': AboutUsCommentsInfo;
    }
  }
}
